const $=id=>document.getElementById(id);const getUser=()=>JSON.parse(localStorage.getItem("pcUser"));const getMeeting=()=>JSON.parse(localStorage.getItem("pcMeeting"));const getRequest=()=>JSON.parse(localStorage.getItem("pcRequest"));
const save=(key,val)=>localStorage.setItem(key,JSON.stringify(val));

const signupForm=$("signupForm");
if(signupForm)signupForm.addEventListener("submit",e=>{e.preventDefault();const user={id:crypto.randomUUID(),name:$("signupName").value.trim(),email:$("signupEmail").value.trim().toLowerCase(),password:$("signupPassword").value,type:$("accountType").value};const users=JSON.parse(localStorage.getItem("pcUsers")||"[]");if(users.some(u=>u.email===user.email)){ $("signupMessage").textContent="An account with that email already exists.";return}users.push(user);save("pcUsers",users);save("pcUser",user);$("signupMessage").textContent="Account created.";setTimeout(()=>location.href=user.type==="teacher"?"teacher.html":"student.html",500)});

const loginForm=$("loginForm");
if(loginForm)loginForm.addEventListener("submit",e=>{e.preventDefault();const email=$("loginEmail").value.trim().toLowerCase(),password=$("loginPassword").value;const users=JSON.parse(localStorage.getItem("pcUsers")||"[]");const user=users.find(u=>u.email===email&&u.password===password);if(!user){$("loginMessage").textContent="Incorrect email or password.";return}save("pcUser",user);location.href=user.type==="teacher"?"teacher.html":"student.html"});

if($("teacherName")){const u=getUser();if(!u||u.type!=="teacher")location.href="login.html";else{$("teacherName").textContent=u.name;renderTeacher()}}
if($("studentName")){const u=getUser();if(!u||u.type!=="student")location.href="login.html";else{$("studentName").textContent=u.name;renderStudent()}}

function createMeeting(){const u=getUser();const meeting={id:crypto.randomUUID(),code:"PC-"+Math.random().toString(36).slice(2,8).toUpperCase(),teacherId:u.id,teacher:u.name,created:Date.now()};save("pcMeeting",meeting);localStorage.removeItem("pcRequest");renderTeacher();alert("Meeting created. Code: "+meeting.code)}

function renderTeacher(){const m=getMeeting(),r=getRequest();$("meetingCount").textContent=m?"1":"0";$("requestCount").textContent=r?"1":"0";$("meetings").innerHTML=m?`<div class="meeting-item"><div><strong>Private Class Meeting</strong><p class="meeting-code">Code: ${m.code}</p></div><button class="btn black-btn" onclick="openMeeting()">Enter Meeting</button></div>`:`<p class="empty">No meetings created yet.</p>`;$("requests").innerHTML=r?`<div class="request-item"><div><strong>${escapeHtml(r.name)}</strong><p>${escapeHtml(r.email)}</p></div><div><button class="accept-btn" onclick="acceptStudent()">Accept</button><button class="reject-btn" onclick="rejectStudent()">Reject</button></div></div>`:`<p class="empty">No students are waiting.</p>`}

function requestJoin(){const code=$("meetingCode").value.trim().toUpperCase(),m=getMeeting(),u=getUser();if(!m){showStudentMessage("There is no active meeting.");return}if(code!==m.code){showStudentMessage("Invalid meeting code.");return}save("pcRequest",{id:crypto.randomUUID(),name:u.name,email:u.email,studentId:u.id,meetingId:m.id,status:"pending"});localStorage.setItem("pcJoinStatus","pending");showStudentMessage("Request sent. Wait for the teacher to accept you.");renderStudent()}

function renderStudent(){const status=localStorage.getItem("pcJoinStatus"),m=getMeeting();if(!m){$("studentStatus").innerHTML='<p class="empty">No active meeting.</p>';return}let html=`<div class="meeting-item"><div><strong>Private Class Meeting</strong><p class="meeting-code">Teacher: ${escapeHtml(m.teacher)} · Code: ${m.code}</p></div>`;if(status==="accepted")html+=`<button class="btn black-btn" onclick="openMeeting()">Join Meeting</button>`;else if(status==="pending")html+=`<span>Waiting for teacher approval...</span>`;else if(status==="rejected")html+=`<span>Your request was rejected.</span>`;html+="</div>";$("studentStatus").innerHTML=html}

function acceptStudent(){localStorage.setItem("pcJoinStatus","accepted");localStorage.setItem("pcAcceptedStudent",getRequest().studentId);localStorage.removeItem("pcRequest");renderTeacher();alert("Student accepted.")}function rejectStudent(){localStorage.setItem("pcJoinStatus","rejected");localStorage.removeItem("pcRequest");renderTeacher();alert("Student rejected.")}

function openMeeting(){const u=getUser(),m=getMeeting();if(!m)return;if(u.type==="student"&&localStorage.getItem("pcJoinStatus")!=="accepted"){alert("The teacher must accept your request first.");return}location.href="meeting.html"}

function logout(){localStorage.removeItem("pcUser");location.href="index.html"}function showStudentMessage(msg){if($("studentMessage"))$("studentMessage").textContent=msg}function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

let localStream=null;
async function startCamera(){try{localStream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});$("localVideo").srcObject=localStream;$("meetingNotice").textContent="Camera and microphone are on. This demo currently shows your local camera."; }catch(e){$("meetingNotice").textContent="Camera/microphone permission was not granted. Allow access in your browser."}}
if($("localVideo")){const u=getUser(),m=getMeeting();if(!u||!m)location.href="login.html";else if(u.type==="student"&&localStorage.getItem("pcJoinStatus")!=="accepted"){alert("You have not been accepted into this meeting.");location.href="student.html"}else startCamera()}
function toggleMic(){if(localStream)localStream.getAudioTracks().forEach(t=>t.enabled=!t.enabled)}function toggleCamera(){if(localStream)localStream.getVideoTracks().forEach(t=>t.enabled=!t.enabled)}
async function shareScreen(){try{const s=await navigator.mediaDevices.getDisplayMedia({video:true});$("localVideo").srcObject=s;s.getVideoTracks()[0].onended=()=>{if(localStream)$("localVideo").srcObject=localStream}}catch(e){}}
function leaveMeeting(){if(localStream)localStream.getTracks().forEach(t=>t.stop());location.href=getUser()?.type==="teacher"?"teacher.html":"student.html"}