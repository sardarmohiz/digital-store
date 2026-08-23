// app.js

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});


// ========================================
// LOAD PRODUCTS
// ========================================

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
    <div style="width:100%;text-align:center;padding:40px;">
      Loading products...
    </div>
  `;

  try {

    const { data, error } =
      await supabaseClient
        .from("products")
        .select("*")
        .eq("published", true)
        .order("created_at", {
          ascending: false
        });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {

      container.innerHTML = `
        <div style="width:100%;text-align:center;padding:40px;">
          <h3>No products available</h3>
          <p>Products will appear here soon.</p>
        </div>
      `;

      return;
    }


    // ========================================
    // CREATE PRODUCT CARDS
    // ========================================

    container.innerHTML =
      data.map(product => {

        const title =
          escapeHTML(
            product.title || "Untitled Product"
          );

        const description =
          escapeHTML(
            product.description || ""
          );

        const category =
          escapeHTML(
            product.category || "Digital"
          );

        const price =
          Number(
            product.price || 0
          ).toFixed(2);

        const image =
          product.image_url ||
          "https://via.placeholder.com/600x400?text=Digital+Product";


        return `

          <article class="product-card">

            <div class="product-image-wrapper">

              <img
                src="${image}"
                alt="${title}"
                class="product-image"
                loading="lazy"
                onerror="this.src='https://via.placeholder.com/600x400?text=No+Image'"
              >

            </div>


            <div class="product-info">

              <span class="product-category">
                ${category}
              </span>

              <h3 class="product-title">
                ${title}
              </h3>

              <p class="product-description">
                ${description}
              </p>


              <div class="product-bottom">

                <strong class="product-price">
                  $${price}
                </strong>

                <button
                  class="buy-btn"
                  type="button"
                  onclick="openProduct('${product.id}')"
                >
                  View Product
                </button>

              </div>

            </div>

          </article>

        `;

      }).join("");

  } catch (error) {

    console.error(
      "Products loading error:",
      error
    );

    container.innerHTML = `
      <div style="width:100%;text-align:center;padding:40px;">
        <h3>Unable to load products</h3>
        <p>
          ${escapeHTML(
            error.message ||
            "Please try again."
          )}
        </p>
      </div>
    `;
  }
}


// ========================================
// OPEN PRODUCT
// ========================================

function openProduct(id) {

  if (!id) {
    console.error("Product ID missing.");
    return;
  }

  window.location.href =
    "product.html?id=" +
    encodeURIComponent(id);
}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
