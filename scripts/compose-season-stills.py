#!/usr/bin/env python3
"""Seasonal studio stills for the drinks listed in data/still-seasons.json.

Input:  stills/masters/<slug>.png  (transparent master cutout, 1200x1200 RGBA)
Output: public/drinks/season/<slug>_<spring|summer|autumn|winter>.webp
        stills/season-fidelity.json

The backdrop is procedural: plaster wall, one upper-left window, a table. The product pixels are
never repainted: label, logo, print and cap stay identical to the master (print_maxdiff must be 0).
Only large clear-glass areas let the wall show through, and the 2px rim gets fringe clean-up and
window-side light wrap.

Usage (repo root):  python3 scripts/compose-season-stills.py [slug ...]
Needs numpy, scipy, scikit-image and Pillow.
"""
import json, os, sys, zlib
import numpy as np
from PIL import Image
from scipy.ndimage import (gaussian_filter, binary_erosion, binary_closing, binary_dilation,
                           distance_transform_edt, label as cc_label)
from skimage.metrics import structural_similarity as ssim

S=1200; HORIZON=0.745; BASE_Y=0.885; PROD_H=0.60
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST=json.load(open(os.path.join(ROOT,'data','still-seasons.json'),encoding='utf-8'))
TINTS={slug:tuple(v['tint']) for slug,v in MANIFEST['drinks'].items()}

# palette + light geometry per season
SEASONS={
 'spring': dict(lit=(246,234,236),shade=(204,192,200),table=(247,243,243),ang=30,period=0.24,duty=0.56,off=0.03,mull=0.45,soft=1.6,gain=0.42,leaf=0.30,leafsize=0.018,leafcol=(250,226,232),seed=21),
 'summer': dict(lit=(244,252,253),shade=(196,220,226),table=(248,251,251),ang=24,period=0.27,duty=0.62,off=0.00,mull=0.40,soft=0.7,gain=0.62,leaf=0.55,leafsize=0.03,leafcol=None,seed=22),
 'autumn': dict(lit=(246,220,184),shade=(190,152,118),table=(246,236,224),ang=40,period=0.30,duty=0.55,off=-0.06,mull=0.33,soft=1.1,gain=0.58,leaf=0.40,leafsize=0.035,leafcol=None,seed=23),
 'winter': dict(lit=(216,224,234),shade=(150,162,178),table=(232,236,241),ang=32,period=0.23,duty=0.52,off=0.08,mull=0.60,soft=2.0,gain=0.32,leaf=0.0,seed=24),
}

def window_light(p, rng):
    yy,xx=np.mgrid[0:S,0:S].astype(np.float32)/S
    a=np.deg2rad(p['ang'])
    v=-xx*np.sin(a)+yy*np.cos(a); u=xx*np.cos(a)+yy*np.sin(a)
    # slightly irregular slat widths
    ph=(v+p['off'])/p['period']; idx=np.floor(ph); fr=ph-idx
    jitter=0.06*np.sin(idx*2.3+p['seed'])
    bands=(fr<p['duty']+jitter).astype(np.float32)
    cross=(np.mod((u-p['mull'])/0.9,1.0)>0.045).astype(np.float32)
    pat=bands*cross
    env=np.clip(1.2-0.9*u,0,1)*np.clip((v+0.6)/0.3,0,1)
    sharp=gaussian_filter(pat,S*0.009*p['soft']); soft=gaussian_filter(pat,S*0.024*p['soft'])
    w=np.clip(u*0.9,0,1)
    L=(sharp*(1-w)+soft*w)*env
    if p.get('leaf',0)>0:   # out-of-focus foliage/branch shadow inside the light, a season hint only
        def oct(sig):
            g=gaussian_filter(rng.random((S,S)),sig); return (g-g.mean())/g.std()
        n=oct(S*p['leafsize'])+0.6*oct(S*p['leafsize']/2.5)
        leaf=np.clip((n-0.35)*1.4,0,1)
        leaf=gaussian_filter(leaf,S*0.006)
        # foliage shadow sits mostly in the upper part of the throw
        yy2=np.mgrid[0:S,0:S][0]/S
        leaf=leaf*np.clip(1.1-yy2*1.2,0,1)
        L=L*(1-p['leaf']*leaf)
    return np.clip(gaussian_filter(L,2),0,1)

def render_bg(p):
    rng=np.random.default_rng(p['seed'])
    lit=np.array(p['lit'],np.float32); shade=np.array(p['shade'],np.float32)
    yy,xx=np.mgrid[0:S,0:S].astype(np.float32)/S
    L=window_light(p,rng)
    amb=0.28+0.18*(1-xx)+0.08*(1-yy)
    k=np.clip(amb+p['gain']*L,0,1)[...,None]
    wall=shade+(lit-shade)*k
    if p.get('leafcol'):   # faint blossom-coloured glow in the lit area (spring)
        wall=wall*(1-0.15*L[...,None])+np.array(p['leafcol'],np.float32)*0.15*L[...,None]
    n=gaussian_filter(rng.normal(0,1,(S,S)),1.2)*2.0+gaussian_filter(rng.normal(0,1,(S,S)),7)*3.0
    wall=wall+n[...,None]
    table=np.array(p['table'],np.float32)*0.55+lit*0.45
    ty=np.clip((yy-HORIZON)/(1-HORIZON),0,1)
    tab=table*(0.95+0.05*ty)[...,None]
    Lt=gaussian_filter(np.roll(L,int(S*0.28),axis=0),S*0.025)
    tab=tab*(0.975+0.035*Lt[...,None])-((xx-0.5).clip(0)*5)[...,None]
    tab=tab+(gaussian_filter(rng.normal(0,1,(S,S)),1.0)*1.0)[...,None]
    hy=int(S*HORIZON)
    img=wall.copy(); img[hy:]=tab[hy:]
    j=np.exp(-((yy-HORIZON)*S/2.5)**2)[...,None]
    img=img*(1-0.07*j)
    return np.clip(gaussian_filter(img,(0.6,0.6,0)),0,255), L

def load_product(slug):
    master=Image.open(f'{ROOT}/stills/masters/{slug}.png').convert('RGBA')
    prod=master.convert('RGB'); m=master.getchannel('A')
    a=np.asarray(m,np.float32)/255; ys,xs=np.where(a>0.5)
    box=(xs.min(),ys.min(),xs.max()+1,ys.max()+1)
    prod=prod.crop(box); m=m.crop(box)
    h=int(S*PROD_H); sc=h/prod.height; w=int(round(prod.width*sc))
    P=np.asarray(prod.resize((w,h),Image.Resampling.LANCZOS),np.float32)
    A=np.asarray(m.resize((w,h),Image.Resampling.LANCZOS),np.float32)/255
    A[A<0.03]=0
    inner=binary_erosion(A>0.98,iterations=2)
    A[inner]=1.0
    # choke the soft rim by ~0.7px to drop the white fringe from the original sweep
    A=np.where(inner,1.0,np.clip((A-0.25)/0.75,0,1))
    return P,A,inner,sc

def shadows(A,px,py,w,h,out,p):
    yy,xx=np.mgrid[0:S,0:S].astype(np.float32)
    base_row=None
    for r in range(h-1,0,-1):
        if (A[r]>0.5).sum()>3: base_row=r; break
    cols=np.where((A[max(0,base_row-10):base_row-4]>0.5).any(0))[0]
    bl,br=cols.min(),cols.max(); bw=br-bl; bcx=px+(bl+br)/2; by=py+base_row
    # 1) contact line: the visible front lip of the footprint, right at and just below the base edge
    dxn=np.clip(np.abs(xx-bcx)/(bw*0.50),0,1.5)
    hprof=np.sqrt(np.clip(1-dxn**2,0,1))*(0.75+0.25*np.tanh((xx-bcx)/(bw*0.25)))
    below=np.clip(yy-(by-1),0,None)
    contact=hprof*np.exp(-below/2.6)*(yy>=by-4)
    contact=gaussian_filter(contact,1.0)
    # 2) ambient occlusion: a little wider, biased away from the light (to the right)
    ao=np.exp(-(((xx-(bcx+bw*0.10))/(bw*0.80))**2+((yy-(by+3))/14.0)**2))
    ao=gaussian_filter(ao,2.5)
    # 3) cast shadow from one upper-left window: point at height z lands at (x+z*kx, y-z*ky)
    kx,ky=0.55,0.16
    sil=np.zeros((S,S),np.float32); dist=np.zeros((S,S),np.float32)
    rs,cs=np.where(A[:base_row+1]>0.5)
    z=(base_row-rs).astype(np.float32)
    X=(px+cs+z*kx).astype(int); Y=(by-z*ky).astype(int)
    depth=max(2,int(bw*0.20))          # cylinder depth foreshortened on the table
    for dy in range(-depth,1):
        Yd=Y+dy; ok=(X>=0)&(X<S)&(Yd>=0)&(Yd<S)
        np.maximum.at(sil,(Yd[ok],X[ok]),1.0); np.maximum.at(dist,(Yd[ok],X[ok]),z[ok]/h)
    sil=binary_closing(sil>0,iterations=3).astype(np.float32)
    dist=gaussian_filter(dist,4)/np.maximum(gaussian_filter(sil,4),1e-3)
    near=gaussian_filter(sil,3); far=gaussian_filter(sil,16)
    wgt=np.clip(dist*1.5,0,1)
    cast=(near*(1-wgt)+far*wgt)*(0.42-0.30*np.clip(dist,0,1))
    hy=int(S*HORIZON)
    tm=np.clip((yy-hy)/3.0,0,1)
    dark=np.clip(0.85*contact+0.45*ao+cast,0,0.85)*tm
    tint=np.array(p['shade'],np.float32)/255
    return out*(1-dark[...,None]*(1-tint*0.30)), (bl,br,base_row)

def compose(slug, look):
    p=dict(SEASONS[look]); t=np.array(TINTS[slug],np.float32)
    p['lit']=tuple(np.array(p['lit'])*0.82+t*0.18); p['shade']=tuple(np.array(p['shade'])*0.90+t*0.10*0.80)
    # small per-drink shift of the window so drinks shown side by side in one season are not stamped alike
    h=zlib.crc32(slug.encode()); j=lambda k: ((h>>k)&255)/255-0.5
    p['ang']+=6*j(0); p['off']+=0.10*j(8); p['mull']+=0.30*j(16); p['seed']=p['seed']*100+(h%97)
    bg,L=render_bg(p)
    P,A,inner,sc=load_product(slug); h,w=A.shape
    px=(S-w)//2; py=int(S*BASE_Y)-h
    out,(bl,br,base_row)=shadows(A,px,py,w,h,bg.copy(),p)
    # faint reflection, starting exactly at the base
    rh=int(h*0.16); R=gaussian_filter(P[:base_row+1][::-1][:rh],(2,2,0)); RA=A[:base_row+1][::-1][:rh]
    fade=np.linspace(0.08,0,rh)[:,None]
    y0=py+base_row+1; rr=min(rh,S-y0); reg=out[y0:y0+rr,px:px+w]; k=(RA[:rr]*fade[:rr])[...,None]
    out[y0:y0+rr,px:px+w]=reg*(1-k)+R[:rr]*k
    region=out[py:py+h,px:px+w].copy()
    # see-through glass
    mn=P.min(2); mx=P.max(2); sat=(mx-mn)/np.maximum(mx,1)
    printed=((sat>0.14)|(mn<165))&(A>0.5)
    protect=binary_dilation(binary_closing(printed,iterations=10),iterations=4)
    glass=(~protect)&(A>0.5)&(sat<0.14)&(mn>=150)
    lab,n=cc_label(glass); sizes=np.bincount(lab.ravel()); keep=sizes>=4000; keep[0]=False
    protect=protect|(glass&~keep[lab]); glass=glass&keep[lab]
    trans=np.clip(distance_transform_edt(glass)/4.0,0,1)*np.clip((mn-150)/40,0,1)
    trans=gaussian_filter(trans,1.0)*glass
    behind=gaussian_filter(region,(7,7,0))
    Pt=P*(1-trans[...,None])+np.clip(P*behind/246.0,0,255)*trans[...,None]
    # edge band: decontaminate white fringe, then window-side light wrap (left side brighter)
    band=(A>0)&(~inner)
    Aa=np.maximum(A,1e-3)[...,None]
    dec=np.clip((P-(1-A[...,None])*248)/Aa,0,255)
    Pt=np.where(band[...,None],dec,Pt)
    lw=gaussian_filter(region,(5,5,0))
    side=np.linspace(1.0,0.35,w)[None,:]              # light from the left
    Ly=L[py:py+h,px:px+w]
    kw=(0.18+0.22*Ly)*side
    Pt=np.where(band[...,None],Pt*(1-kw[...,None])+lw*kw[...,None],Pt)
    comp=region*(1-A[...,None])+Pt*A[...,None]
    out[py:py+h,px:px+w]=comp
    full_A=np.zeros((S,S),np.float32); full_A[py:py+h,px:px+w]=A
    g=np.random.default_rng(9).normal(0,1.5,(S,S))[...,None]
    out=np.clip(out+g*(1-full_A[...,None]),0,255).astype(np.uint8)
    # fidelity vs resized cutout
    ro=out[py:py+h,px:px+w].astype(np.float32); d=np.abs(ro-P).max(2)
    prot=inner&protect; opaque=inner&(trans<0.01); see=inner&(trans>=0.01)
    gO=ro.mean(2); gP=P.mean(2); ys,xs=np.where(inner); bx=(slice(ys.min(),ys.max()+1),slice(xs.min(),xs.max()+1))
    _,smap=ssim(gP[bx],gO[bx],data_range=255,full=True)
    st=dict(print_px=int(prot.sum()),print_maxdiff=float(d[prot].max()),opaque_px=int(opaque.sum()),
            opaque_maxdiff=float(d[opaque].max()),seethrough_frac=round(float(see.sum()/inner.sum()),4),
            seethrough_meandiff=round(float(d[see].mean()),2) if see.any() else 0.0,edge_band_px=int(band.sum()),
            ssim_print=round(float(smap[prot[bx]].mean()),5),ssim_inner=round(float(smap[inner[bx]].mean()),5),
            layout=dict(scale=round(sc,4),x=px,y=py,w=w,h=h,base_y=int(py+base_row)))
    return out,st


if __name__=='__main__':
    slugs=sys.argv[1:] or list(MANIFEST['drinks'])
    out_dir=os.path.join(ROOT,'public','drinks','season'); os.makedirs(out_dir,exist_ok=True)
    fid_path=os.path.join(ROOT,'stills','season-fidelity.json')
    res=json.load(open(fid_path)) if os.path.exists(fid_path) else {}
    bad=[]
    for slug in slugs:
        for season in MANIFEST['seasons']:
            img,st=compose(slug,season)
            Image.fromarray(img).save(os.path.join(out_dir,f'{slug}_{season}.webp'),quality=88,method=6)
            res[f'{slug}_{season}']=st; print(slug,season,'print_maxdiff',st['print_maxdiff'],'ssim_print',st['ssim_print'])
            if st['print_maxdiff']!=0: bad.append(f'{slug}_{season}')
    json.dump(dict(sorted(res.items())),open(fid_path,'w'),indent=2,ensure_ascii=False)
    if bad: sys.exit('print pixels changed: '+', '.join(bad))
