import numpy as np, sys
from scipy import signal
SR=44100; BPM=105.0; BAR=240/BPM; L=4032000/44100; XF=2.5
x=np.load(sys.argv[1]); 
print('shape',x.shape,'sec',x.shape[1]/SR)
pk=np.abs(x).max(); print('peak %.3f (%.1f dBFS)'%(pk,20*np.log10(pk+1e-9)))
mono=x.mean(0)
# seam: start [0,XF] vs end [L,L+XF]
a=x[:, :int(XF*SR)]; b=x[:, 4032000:4032000+int(XF*SR)]
n=min(a.shape[1],b.shape[1]); a=a[:,:n]; b=b[:,:n]
corr=[np.corrcoef(a[c],b[c])[0,1] for c in range(2)]
print('seam corr',corr,'rms diff dB',20*np.log10(np.sqrt(((a-b)**2).mean())/np.sqrt((a**2).mean())))
# per-section rms
secs=[('intro',0,4),('A',4,12),('A2',12,20),('B',20,28),('A3',28,36),('outro',36,40)]
for nm,b0,b1 in secs:
    s=mono[int(b0*BAR*SR):int(b1*BAR*SR)]
    f,P=signal.welch(s,SR,nperseg=8192)
    cen=(f*P).sum()/P.sum()
    def band(lo,hi): return 10*np.log10(P[(f>=lo)&(f<hi)].sum()+1e-20)
    print('%-6s rms %.1f dB  peak %.1f  centroid %4.0f Hz  bands(dB) <120:%.0f 120-500:%.0f 0.5-2k:%.0f 2-6k:%.0f >6k:%.0f'%(nm,20*np.log10(np.sqrt((s**2).mean())),20*np.log10(np.abs(s).max()),cen,band(0,120),band(120,500),band(500,2000),band(2000,6000),band(6000,22000)))
# stereo
m=(x[0]+x[1])/2; sd=(x[0]-x[1])/2
print('side/mid dB',10*np.log10((sd**2).sum()/(m**2).sum()))
# dc
print('dc',x.mean(1))
# per-bar rms envelope (dB)
env=[20*np.log10(np.sqrt((mono[int(i*BAR*SR):int((i+1)*BAR*SR)]**2).mean())+1e-9) for i in range(40)]
print('bar rms:',' '.join('%.0f'%e for e in env))
