const db = firebase.firestore();
const nomineesContainer = document.getElementById("nomineesList");
let userIP = null;

async function fetchUserIP() {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    userIP = data.ip;
  } catch (error) {
    console.error("Failed to fetch IP:", error);
    alert("⚠️ Unable to verify your vote.");
  }
}

async function loadNominees() {
  await fetchUserIP();

  try {
    const snapshot = await db.collection("nominations").get();
    nomineesContainer.innerHTML = "";

    if (snapshot.empty) {
      nomineesContainer.innerHTML = "<p>No nominees yet.</p>";
      return;
    }

    const ipVoteDoc = await db.collection("votes").doc(userIP).get();
    const hasVoted = ipVoteDoc.exists;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const nomineeCard = document.createElement("div");
      nomineeCard.className = "nominee-card";

      const isDisabled = hasVoted ? "disabled" : "";
      const btnClass = hasVoted ? "voted" : "vote";
      const btnLabel = hasVoted ? "Already Voted " : "Vote";

      nomineeCard.innerHTML = `
        <h3>@${data.username}</h3>
        <p>${data.year} - ${data.branch}</p>
        <button class="${btnClass}" ${isDisabled} onclick="castVote('${doc.id}', this)">${btnLabel}</button>
      `;

      nomineesContainer.appendChild(nomineeCard);
    });
  } catch (error) {
    nomineesContainer.innerHTML = `<p>Error loading: ${error.message}</p>`;
  }
}

async function castVote(id, button) {
  if (!userIP) {
    alert("IP error. Try again.");
    return;
  }

  try {
    const voteDoc = await db.collection("votes").doc(userIP).get();
    if (voteDoc.exists) {
      alert("You already voted.");
      disableAllButtons();
      return;
    }

    await db.collection("votes").doc(userIP).set({
      voted: true,
      time: new Date().toISOString()
    });

    const nomineeRef = db.collection("nominations").doc(id);
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(nomineeRef);
      const newVotes = (doc.data().votes || 0) + 1;
      transaction.update(nomineeRef, { votes: newVotes });
    });

    alert("✅ Vote submitted!");
    disableAllButtons(button);
  } catch (error) {
    console.error("Vote error:", error);
    alert("Failed to vote.");
  }
}

function disableAllButtons(clickedButton = null) {
  const allButtons = document.querySelectorAll("button.vote");
  allButtons.forEach(btn => {
    btn.disabled = true;
    btn.textContent = "✅ Voted";
    btn.classList.remove("vote");
    btn.classList.add("voted");
  });
  if (clickedButton) {
    clickedButton.textContent = "✅ Voted";
    clickedButton.classList.remove("vote");
    clickedButton.classList.add("voted");
    clickedButton.disabled = true;
  }
}

loadNominees();
