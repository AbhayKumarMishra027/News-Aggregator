const apiKey = "2c8109dfc684abe57dad72d688b3a325";

const newsContainer = document.getElementById("newsContainer");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const searchBtn = document.getElementById("searchBtn");

let currentPage = 1;
let currentQuery = "";
let currentCategory = "general";
let isLoading = false;

window.addEventListener("load", () => {
  fetchCategoryNews("general", 1, true);
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchNews();
});

categoryFilter.addEventListener("change", () => {
  const selectedCategory = categoryFilter.value || "general";
  currentCategory = selectedCategory;
  currentQuery = "";
  fetchCategoryNews(selectedCategory, 1, true);
});

searchBtn.addEventListener("click", () => searchNews());

function debounce(func, delay = 600) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}
const debouncedSearch = debounce(searchNews, 600);

searchInput.addEventListener("input", () => {
  if (searchInput.value.trim() !== "") debouncedSearch();
});

function searchNews() {
  const query = searchInput.value.trim();
  if (!query) {
    fetchCategoryNews("general", 1, true);
    return;
  }
  currentQuery = query;
  currentCategory = "";
  fetchSearchNews(query, 1, true);
}

async function fetchCategoryNews(category, page = 1, reset = false) {
  if (isLoading) return;
  isLoading = true;

  let url;
  if (category === "general") {
    url = `https://gnews.io/api/v3/top-news?lang=en&max=12&page=${page}&apikey=${apiKey}`;
  } else {
    url = `https://gnews.io/api/v3/top-news?category=${category}&lang=en&max=12&page=${page}&apikey=${apiKey}`;
  }

  if (reset) showMessage(`⏳ Loading ${capitalize(category)} news...`);

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.articles?.length) {
      if (reset) showMessage(`🚫 No ${category} news found.`, "gray");
      isLoading = false;
      return;
    }
    renderNews(data.articles, reset);
    currentPage = page;
  } catch {
    showMessage(`❌ Error fetching news.`, "red");
  } finally {
    isLoading = false;
  }
}

async function fetchSearchNews(query, page = 1, reset = false) {
  if (isLoading) return;
  isLoading = true;

  const url = `https://gnews.io/api/v3/search?q=${encodeURIComponent(query)}&lang=en&max=12&page=${page}&apikey=${apiKey}`;
  if (reset) showMessage(`🔍 Searching for "${query}"...`);

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.articles?.length) {
      if (reset) showMessage(`😕 No results for "${query}".`, "gray");
      isLoading = false;
      return;
    }
    renderNews(data.articles, reset);
    currentPage = page;
  } catch {
    showMessage(`❌ Error during search.`, "red");
  } finally {
    isLoading = false;
  }
}

function renderNews(articles, reset = false) {
  if (reset) newsContainer.innerHTML = "";
  articles.forEach(article => {
    const card = createNewsCard(article);
    newsContainer.appendChild(card);
  });
}

function createNewsCard(article) {
  const { title, description, url, image, source, publishedAt } = article;

  const card = document.createElement("div");
  card.className = "news-card";

  const img = document.createElement("img");
  img.src = image || "https://via.placeholder.com/400x200?text=No+Image";
  img.className = "news-img";

  const content = document.createElement("div");
  content.className = "news-content";

  const headline = document.createElement("h3");
  headline.textContent = truncate(title, 80);

  const desc = document.createElement("p");
  desc.textContent = truncate(description || "No description available.", 150);

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `
    <span>📰 ${source?.name || "Unknown"}</span>
    <span>📅 ${formatDate(publishedAt)}</span>
  `;

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.textContent = "Read Full Article →";

  content.append(headline, desc, meta, link);
  card.append(img, content);
  return card;
}

window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    if (!isLoading) {
      if (currentQuery) {
        fetchSearchNews(currentQuery, currentPage + 1);
      } else {
        fetchCategoryNews(currentCategory, currentPage + 1);
      }
    }
  }
});

function showMessage(msg, color = "#333") {
  newsContainer.innerHTML = `<p style="text-align:center; color:${color};">${msg}</p>`;
}

function truncate(str, n) {
  return str?.length > n ? str.slice(0, n - 1) + "..." : str;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
