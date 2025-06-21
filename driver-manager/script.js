
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const email = username + "@drivermanager.app";
  firebase.auth().signInWithEmailAndPassword(email, password).then(userCred => {
    const uid = userCred.user.uid;
    return db.collection("users").doc(uid).get();
  }).then(doc => {
    const role = doc.data().role;
    if (role === "driver") location.href = "driver.html";
    else if (role === "manager") location.href = "manager.html";
  }).catch(err => {
    document.getElementById("error").innerText = err.message;
  });
}

function markIN() {
  const shift = document.getElementById("shift").value;
  const uid = firebase.auth().currentUser.uid;
  db.collection("logs").add({
    uid,
    type: "IN",
    shift,
    timestamp: new Date().toISOString()
  });
  alert("IN marked");
}

function markOUT() {
  const uid = firebase.auth().currentUser.uid;
  db.collection("logs").add({
    uid,
    type: "OUT",
    timestamp: new Date().toISOString()
  });
  alert("OUT marked");
}

function markDUTY() {
  const note = document.getElementById("note").value;
  const uid = firebase.auth().currentUser.uid;
  db.collection("logs").add({
    uid,
    type: "DUTY",
    note,
    timestamp: new Date().toISOString()
  });
  alert("DUTY recorded");
}

function loadLogs() {
  const uid = firebase.auth().currentUser.uid;
  const from = new Date(document.getElementById("fromDate").value);
  const to = new Date(document.getElementById("toDate").value);
  db.collection("logs").where("uid", "==", uid).get().then(snapshot => {
    const tbody = document.querySelector("#logTable tbody");
    tbody.innerHTML = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      const time = new Date(d.timestamp);
      if (time >= from && time <= to) {
        const row = `<tr><td>${d.type}</td><td>${d.shift || ""}</td><td>${d.note || ""}</td><td>${time.toLocaleString()}</td></tr>`;
        tbody.innerHTML += row;
      }
    });
  });
}

function loadAllLogs() {
  const from = new Date(document.getElementById("fromDate").value);
  const to = new Date(document.getElementById("toDate").value);
  db.collection("logs").get().then(snapshot => {
    const tbody = document.querySelector("#allLogs tbody");
    tbody.innerHTML = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      const time = new Date(d.timestamp);
      if (time >= from && time <= to) {
        const row = `<tr><td>${d.uid}</td><td>${d.type}</td><td>${d.shift || ""}</td><td>${d.note || ""}</td><td>${time.toLocaleString()}</td></tr>`;
        tbody.innerHTML += row;
      }
    });
  });
}

function logout() {
  firebase.auth().signOut()
    .then(() => {
      // Redirect to login page (index.html)
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert("Error during logout: " + error.message);
    });
}


function exportLogs() {
  const rows = [["User", "Type", "Shift", "Note", "Timestamp"]];
  document.querySelectorAll("#allLogs tbody tr").forEach(tr => {
    const cells = [...tr.children].map(td => td.innerText);
    rows.push(cells);
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Logs");
  XLSX.writeFile(wb, "attendance.xlsx");
}
