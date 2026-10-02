const COMMENTS_API_URL = "https://pragya-wiki.onrender.com/comments";


const PAGE_ID = "meghna-mukhhopadhyay";

const commentForm = document.getElementById("comment-form");
const commentNameInput = document.getElementById("comment-name");
const commentTextInput = document.getElementById("comment-text");
const commentSubmitButton = document.getElementById(
  "comment-submit-button"
);
const commentCharacterCount = document.getElementById(
  "comment-character-count"
);
const commentFormMessage = document.getElementById(
  "comment-form-message"
);
const commentsList = document.getElementById("comments-list");

commentTextInput.addEventListener("input", () => {
  commentCharacterCount.textContent =
    `${commentTextInput.value.length} / 1000`;
});

commentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = commentNameInput.value.trim();
  const text = commentTextInput.value.trim();

  if (!text) {
    showFormMessage("Please enter a comment.", true);
    commentTextInput.focus();
    return;
  }

  commentSubmitButton.disabled = true;
  commentSubmitButton.textContent = "Posting...";

  try {
    const response = await fetch(COMMENTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pageId: PAGE_ID,
        username,
        text
      })
    });

    const result = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(result.error || "Could not post comment");
    }

    commentForm.reset();
    commentCharacterCount.textContent = "0 / 1000";
    showFormMessage("Comment posted.", false);

   
    renderComment(result, true);
  } catch (error) {
    console.error(error);
    showFormMessage(error.message, true);
  } finally {
    commentSubmitButton.disabled = false;
    commentSubmitButton.textContent = "Post comment";
  }
});

async function loadComments() {
  commentsList.innerHTML =
    '<p class="comments-status">Loading comments...</p>';

  try {
    const url =
      `${COMMENTS_API_URL}?pageId=${encodeURIComponent(PAGE_ID)}`;

    const response = await fetch(url);
    const comments = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(
        comments.error || "Could not load comments"
      );
    }

    commentsList.innerHTML = "";

    if (comments.length === 0) {
      showEmptyCommentsMessage();
      return;
    }

    comments.forEach((comment) => {
      renderComment(comment, false);
    });
  } catch (error) {
    console.error(error);

    commentsList.innerHTML = "";

    const message = document.createElement("p");
    message.className = "comments-status";
    message.textContent = "Could not load comments.";

    commentsList.appendChild(message);
  }
}

function renderComment(comment, addAtBeginning) {
  removeEmptyCommentsMessage();

  const card = document.createElement("article");
  card.className = "comment-card";
  card.dataset.commentId = String(comment.id);

  const header = document.createElement("div");
  header.className = "comment-header";

  const author = document.createElement("span");
  author.className = "comment-author";

  /*
    An empty optional name appears as Anonymous.
  */
  author.textContent = comment.username || "Anonymous";

  const date = document.createElement("time");
  date.className = "comment-date";
  date.dateTime = comment.createdAt;
  date.textContent = formatCommentDate(comment.createdAt);

  const text = document.createElement("p");
  text.className = "comment-text";


  text.textContent = comment.text;

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "comment-delete-button";
  deleteButton.setAttribute("aria-label", "Delete comment");
  deleteButton.setAttribute("title", "Delete comment");
  deleteButton.textContent = "×";

  deleteButton.addEventListener("click", () => {
    deleteComment(comment.id, card, deleteButton);
  });

  header.append(author, date);
  card.append(header, text, deleteButton);

  if (addAtBeginning) {
    commentsList.prepend(card);
  } else {
    commentsList.appendChild(card);
  }
}

async function deleteComment(commentId, card, deleteButton) {
  const confirmed = window.confirm(
    "Permanently delete this comment?"
  );

  if (!confirmed) {
    return;
  }

  deleteButton.disabled = true;

  try {
    const response = await fetch(
      `${COMMENTS_API_URL}/${commentId}`,
      {
        method: "DELETE"
      }
    );

    if (!response.ok) {
      const result = await readJsonResponse(response);

      throw new Error(
        result.error || "Could not delete comment"
      );
    }

    
    card.remove();

    if (!commentsList.querySelector(".comment-card")) {
      showEmptyCommentsMessage();
    }
  } catch (error) {
    console.error(error);
    alert(error.message);
    deleteButton.disabled = false;
  }
}

function showEmptyCommentsMessage() {
  if (document.getElementById("empty-comments-message")) {
    return;
  }

  const message = document.createElement("p");
  message.id = "empty-comments-message";
  message.className = "comments-status";
  message.textContent =
    "No comments yet. Be the first to comment.";

  commentsList.appendChild(message);
}

function removeEmptyCommentsMessage() {
  const message = document.getElementById(
    "empty-comments-message"
  );

  if (message) {
    message.remove();
  }
}

function formatCommentDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function showFormMessage(message, isError) {
  commentFormMessage.textContent = message;
  commentFormMessage.style.color = isError
    ? "#9b2f2f"
    : "#315f48";
}

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type");

  if (
    contentType &&
    contentType.includes("application/json")
  ) {
    return response.json();
  }

  return {};
}

loadComments();
