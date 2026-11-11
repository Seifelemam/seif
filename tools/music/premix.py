import numpy as np, sys
sys.argv=['x']
import adventure as A
from scipy import signal
buses=A.build()
dry,wet=A.mix(buses,A.GAINS,A.SENDS)
m=dry+0.8*wet
m=signal.sosfilt(signal.butter(2,35,'highpass',fs=A.SR,output='sos'),m,axis=1)
m=A.hishelf(m,3500,4.0)
np.save('pre.npy',m.astype(np.float32))
print('saved',m.shape)
