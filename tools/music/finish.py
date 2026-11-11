import numpy as np, subprocess, re, sys
from scipy.io import wavfile
from scipy.ndimage import maximum_filter1d, uniform_filter1d
SR=44100; LS=4032000; XFS=int(2.5*SR); TARGET=float(sys.argv[1]) if len(sys.argv)>1 else -18.0
def dyn(x, thr, ratio):
    pk=np.abs(x).max(0); env=uniform_filter1d(maximum_filter1d(pk,int(.02*SR)),int(.12*SR))
    db=20*np.log10(env+1e-9); g=10**(-(np.maximum(db-thr,0)*(1-1/ratio))/20); g=uniform_filter1d(g,int(.01*SR)); return x*g[None,:]
def limit(x, lim=-1.5):
    ceil=10**(lim/20); pk=np.abs(x).max(0); la=int(.004*SR)
    e=maximum_filter1d(pk,la*2+1); g=np.minimum(1,ceil/(e+1e-9)); g=uniform_filter1d(g,la*2+1); return x*g[None,:]
def lufs(x, path='/tmp/_l.wav'):
    wavfile.write(path, SR, x.T.astype(np.float32))
    r=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',path,'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True).stderr
    I=float(re.findall(r'I:\s+(-?[\d.]+) LUFS',r)[-1]); LRA=float(re.findall(r'LRA:\s+([\d.]+) LU',r)[-1]); TP=float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS',r)[-1]); return I,LRA,TP
m=np.load('pre.npy').astype(np.float64)
m=dyn(m,-12.0,2.0)
seg=m[:,LS:2*LS+XFS]
I,LRA,TP=lufs(seg); print('after dyn: I %.1f LUFS  LRA %.1f  TP %.1f'%(I,LRA,TP))
gain=10**((TARGET-I)/20); seg=limit(seg*gain)
I,LRA,TP=lufs(seg); print('final: I %.1f LUFS  LRA %.1f  TP %.1f  (gain %.1f dB)'%(I,LRA,TP,20*np.log10(gain)))
np.save('final.npy',seg.astype(np.float32))
wavfile.write('final.wav',SR,(np.clip(seg.T,-1,1)*32767).astype(np.int16))
