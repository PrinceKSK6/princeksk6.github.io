
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

function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = "index.html";
  }).catch(error => {
    alert("Logout error: " + error.message);
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
  }).then(() => {
    alert("IN marked");
  });
}

function markOUT() {
  const uid = firebase.auth().currentUser.uid;
  db.collection("logs").add({
    uid,
    type: "OUT",
    timestamp: new Date().toISOString()
  }).then(() => {
    alert("OUT marked");
  });
}

function markDUTY() {
  const note = document.getElementById("note").value;
  const uid = firebase.auth().currentUser.uid;
  db.collection("logs").add({
    uid,
    type: "DUTY",
    note,
    timestamp: new Date().toISOString()
  }).then(() => {
    alert("ON DUTY marked");
  });
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

function loadAvailableDrivers() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  db.collection("logs")
    .where("timestamp", ">=", today.toISOString())
    .where("timestamp", "<", tomorrow.toISOString())
    .get()
    .then(snapshot => {
      const inLogs = {};
      const outLogs = new Set();

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === "IN") {
          inLogs[data.uid] = data;
        } else if (data.type === "OUT") {
          outLogs.add(data.uid);
        }
      });

      const available = Object.keys(inLogs).filter(uid => !outLogs.has(uid));
      const ul = document.getElementById("todayList");
      ul.innerHTML = "";

      available.forEach(uid => {
        db.collection("users").doc(uid).get().then(userDoc => {
          const name = userDoc.data().name || uid;
          const info = inLogs[uid];
          const item = document.createElement("li");
          item.innerText = `${name} - Shift ${info.shift || ""} at ${new Date(info.timestamp).toLocaleTimeString()}`;
          ul.appendChild(item);
        });
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
        db.collection("users").doc(d.uid).get().then(userDoc => {
          const name = userDoc.exists ? (userDoc.data().name || d.uid) : d.uid;
          const row = `<tr><td>${name}</td><td>${d.type}</td><td>${d.shift || ""}</td><td>${d.note || ""}</td><td>${time.toLocaleString()}</td></tr>`;
          tbody.innerHTML += row;
        });
      }
    });
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
