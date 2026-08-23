// app.js

document.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();
});

async function loadProducts() {
  const container =
    document.getElementById("products") ||
    document.getElementById("productGrid") ||
    document.getElementById("productsGrid");

  if (!container) {
    console.error("Products container not found.");
    return;
  }

  container.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:40px;">
      Loading products...
    </div>
  `;

  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;">
          <h3>No products available</h3>
          <p>Products will appear here when you add them.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = data.map(product => {
      const image =
        product.image_url ||
        product.image ||
        "https://via.placeholder.com/600x400?text=Digital+Product";

      const title =
        product.title ||
        product.name ||
        "Untitled Product";

      const description =
        product.description ||
        product.excerpt ||
        "";

      const price =
        product.price !== null &&
        product.price !== undefined
          ? `$${product.price}`
          : "Free";

      return `
        <div class="product-card">
          <img
            src="${image}"
            alt="${escapeHTML(title)}"
            class="product-image"
            loading="lazy"
          >

          <div class="product-info">
            <h3>${escapeHTML(title)}</h3>

            <p>${escapeHTML(description)}</p>

            <div class="product-bottom">
              <strong>${escapeHTML(price)}</strong>

              <button
                class="buy-btn"
                onclick="viewProduct('${product.id}')"
              >
                View Product
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

  } catch (error) {
    console.error("Products loading error:", error);

    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;">
        <h3>Unable to load products</h3>
        <p>Please check your Supabase connection and products table.</p>
      </div>
    `;
  }
}

function viewProduct(id) {
  window.location.href = `product.html?id=${encodeURIComponent(id)}`;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
