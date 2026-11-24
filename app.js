"use strict";

const GET_URL = "https://jsonplaceholder.typicode.com/posts?_limit=5";
const POST_URL = "https://jsonplaceholder.typicode.com/posts";
const loadButton = document.querySelector("#loadButton");
const loadMessage = document.querySelector("#loadMessage");
const postList = document.querySelector("#postList");
const feedEmpty = document.querySelector("#feedEmpty");
const postCount = document.querySelector("#postCount");
const form = document.querySelector("#publishForm");
const editorFields = document.querySelector("#editorFields");
const titleInput = document.querySelector("#titleInput");
const bodyInput = document.querySelector("#bodyInput");
const publishMessage = document.querySelector("#publishMessage");
const publishedResult = document.querySelector("#publishedResult");

function message(element, text, state = "info") {
  element.textContent = text;
  element.dataset.state = state;
}

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return { data, status: response.status };
}

function createPostCard(post) {
  const card = document.createElement("article");
  card.className = "post";
  const label = document.createElement("span");
  label.className = "post-label";
  label.textContent = `ПУБЛИКАЦИЯ ${post.id}`;
  const title = document.createElement("h3");
  title.textContent = post.title;
  const body = document.createElement("p");
  body.textContent = post.body;
  card.append(label, title, body);
  return card;
}

async function loadPosts() {
  loadButton.disabled = true;
  postList.setAttribute("aria-busy", "true");
  message(loadMessage, "Загрузка публикаций…");
  try {
    const { data, status } = await request(GET_URL);
    if (!Array.isArray(data)) throw new Error("Неверный формат списка публикаций");
    postList.replaceChildren(...data.map(createPostCard));
    postCount.textContent = String(data.length);
    feedEmpty.hidden = data.length > 0;
    feedEmpty.querySelector("p").textContent = "В списке нет публикаций";
    message(loadMessage, `Получено записей: ${data.length}. HTTP ${status}.`, "success");
  } catch (error) {
    const previous = postList.childElementCount ? " Ранее загруженные записи оставлены на странице." : "";
    message(loadMessage, `Не удалось загрузить публикации (${error.message}). Проверьте подключение и повторите попытку.${previous}`, "error");
  } finally {
    loadButton.disabled = false;
    postList.setAttribute("aria-busy", "false");
  }
}

function checkField(input, errorId, errorText) {
  const valid = input.value.trim().length > 0;
  input.setAttribute("aria-invalid", String(!valid));
  document.getElementById(errorId).textContent = valid ? "" : errorText;
  return valid;
}

function showPublished(post) {
  document.querySelector("#publishedId").textContent = `ID В ОТВЕТЕ СЕРВЕРА: ${post.id}`;
  document.querySelector("#publishedTitle").textContent = post.title;
  document.querySelector("#publishedBody").textContent = post.body;
  publishedResult.hidden = false;
}

async function publishPost(event) {
  event.preventDefault();
  if (editorFields.disabled) return;
  publishedResult.hidden = true;
  const titleValid = checkField(titleInput, "titleError", "Введите заголовок, а не только пробелы.");
  const bodyValid = checkField(bodyInput, "bodyError", "Введите текст публикации, а не только пробелы.");
  if (!titleValid || !bodyValid) {
    message(publishMessage, "Заполните оба поля. Публикация не отправлена.", "error");
    (!titleValid ? titleInput : bodyInput).focus();
    return;
  }
  const payload = { title: titleInput.value.trim(), body: bodyInput.value.trim(), userId: 1 };
  editorFields.disabled = true;
  form.setAttribute("aria-busy", "true");
  message(publishMessage, "Отправка публикации…");
  try {
    const { data, status } = await request(POST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    showPublished(data);
    message(publishMessage, `Публикация успешно создана. HTTP ${status}.`, "success");
    form.reset();
  } catch (error) {
    message(publishMessage, `Не удалось отправить публикацию (${error.message}). Текст сохранён в форме, попробуйте снова.`, "error");
  } finally {
    editorFields.disabled = false;
    form.setAttribute("aria-busy", "false");
  }
}

loadButton.addEventListener("click", loadPosts);
form.addEventListener("submit", publishPost);
for (const [input, errorId] of [[titleInput, "titleError"], [bodyInput, "bodyError"]]) {
  input.addEventListener("input", () => {
    input.setAttribute("aria-invalid", "false");
    document.getElementById(errorId).textContent = "";
  });
}
