from pathlib import Path
import subprocess,json,sys
root=Path(__file__).resolve().parents[1]
logs=root.parent/'logs'
preview='--preview' in sys.argv
prefix='preview' if preview else 'vite'
with (logs/(prefix+'.stdout.log')).open('w') as out,(logs/(prefix+'.stderr.log')).open('w') as err:
    p=subprocess.Popen(['cmd.exe','/c','npm run preview' if preview else 'npm run dev'],cwd=root,stdin=subprocess.DEVNULL,stdout=out,stderr=err,creationflags=subprocess.DETACHED_PROCESS|subprocess.CREATE_NEW_PROCESS_GROUP,close_fds=True)
(logs/(prefix+'_process.json')).write_text(json.dumps({'pid':p.pid,'url':'http://127.0.0.1:4173/' if preview else 'http://127.0.0.1:5173/'}))
print('VITE_STARTED',p.pid)
