import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,onSnapshot} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
const config={apiKey:'AIzaSyAYu4teVOnU2Hzg_ImPRGxMIiCu7gMOwQg',authDomain:'maxbye-b0852.firebaseapp.com',projectId:'maxbye-b0852',storageBucket:'maxbye-b0852.firebasestorage.app',messagingSenderId:'57012876259',appId:'1:57012876259:web:c028eede6f0ddaa015a6d6'};
const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app);
const owner='maxbye@gmail.com';
const sections=window.todoCloudSections;
const refs=Object.fromEntries(Object.keys(sections).map(k=>[k,doc(db,'sharedTodos',k)]));
let allowed=false,ready=false,loading=true;
const bar=document.createElement('div');
bar.id='cloud-bar';bar.style.cssText='max-width:640px;margin:12px auto;padding:12px 18px;background:#e9f5f3;border:1px solid #c4e7df;border-radius:8px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font:14px Arial,sans-serif;color:#294d4b';
const status=document.createElement('span');status.textContent='Connecting to shared tasks…';
const login=document.createElement('button');login.textContent='Owner sign in';login.type='button';
const importBtn=document.createElement('button');importBtn.textContent='Import this device’s saved tasks';importBtn.type='button';importBtn.hidden=true;
const logout=document.createElement('button');logout.textContent='Sign out';logout.type='button';logout.hidden=true;
bar.append(status,login,importBtn,logout);
document.querySelector('header').after(bar);
const setStatus=t=>status.textContent=t;
function updateControls(){login.hidden=allowed;logout.hidden=!allowed;importBtn.hidden=!allowed||!ready;document.querySelectorAll('input,form button,.check,.drag-handle,.icon,.christmas-edit').forEach(el=>{if(!el.closest('#cloud-bar'))el.disabled=!allowed||!ready});}
window.todoCloudSave=(section,value)=>{
 if(!allowed||!ready)return;
 setDoc(refs[section],{items:JSON.parse(JSON.stringify(value)),updatedAt:new Date().toISOString()}).catch(e=>setStatus('Sync failed: '+e.message));
};
document.addEventListener('click',e=>{if(allowed&&ready)return;if(e.target.closest('#cloud-bar'))return;if(e.target.closest('.check,.icon,.christmas-edit,.drag-handle')){e.preventDefault();e.stopImmediatePropagation()}},true);
document.addEventListener('submit',e=>{if(!allowed||!ready){e.preventDefault();e.stopImmediatePropagation()}},true);
login.onclick=()=>signInWithPopup(auth,new GoogleAuthProvider()).catch(e=>setStatus('Sign-in failed: '+e.message));
logout.onclick=()=>signOut(auth);
importBtn.onclick=async()=>{
 if(!allowed||!ready)return;
 if(!confirm('Replace shared cloud lists with the tasks saved in this browser? This overwrites the cloud copy for both pages.'))return;
 try{
   for(const [key,section] of Object.entries(sections)){
     const raw=localStorage.getItem(section.storageKey);
     if(raw){const data=JSON.parse(raw);if(Array.isArray(data))await setDoc(refs[key],{items:data,updatedAt:new Date().toISOString()})}
   }
   setStatus('Imported local tasks to Firestore.');
 }catch(e){setStatus('Import failed: '+e.message)}
};
onAuthStateChanged(auth,user=>{
 allowed=!!user&&user.email?.toLowerCase()===owner;
 if(user&&!allowed)setStatus('Signed in as '+user.email+'. View only.');
 else if(allowed)setStatus('Signed in as owner. Changes sync across devices.');
 else setStatus('Shared tasks — view only. Owner can sign in to edit.');
 updateControls();
});
let pending=Object.keys(sections).length;
for(const [key,section] of Object.entries(sections)){
 onSnapshot(refs[key],snapshot=>{
   if(snapshot.exists()&&Array.isArray(snapshot.data().items))section.apply(snapshot.data().items);
   else if(!snapshot.exists())section.apply([]);
   if(pending>0){pending--;if(pending===0){ready=true;loading=false;updateControls();if(!allowed)setStatus('Shared tasks — view only. Owner can sign in to edit.')}} 
 },e=>{setStatus('Firestore unavailable: '+e.message);ready=false;updateControls()});
}
updateControls();
