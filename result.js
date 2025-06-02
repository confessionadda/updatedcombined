const resultList = document.getElementById("resultList");

db.collection("nominations")
  .orderBy("votes", "desc")
  .limit(10)
  .onSnapshot(snapshot => {
    resultList.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const li = document.createElement("li");
      li.textContent = `${data.username} (${data.year}, ${data.branch}) - ${data.votes} votes`;
      resultList.appendChild(li);
    });
  });
