// admin.js

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const productForm = document.getElementById("productForm");
const productMessage = document.getElementById("productMessage");
const adminProducts = document.getElementById("adminProducts");
const logoutBtn = document.getElementById("logoutBtn");
const refreshProducts = document.getElementById("refreshProducts");


// ==========================
// CHECK LOGIN
// ==========================

document.addEventListener("DOMContentLoaded", checkUser);

async function checkUser() {

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {
    showDashboard();
  } else {
    showLogin();
  }
}


// ==========================
// SHOW LOGIN
// ==========================

function showLogin() {

  if (loginSection) {
    loginSection.style.display = "block";
  }

  if (dashboardSection) {
    dashboardSection.style.display = "none";
  }
}


// ==========================
// SHOW DASHBOARD
// ==========================

async function showDashboard() {

  if (loginSection) {
    loginSection.style.display = "none";
  }

  if (dashboardSection) {
    dashboardSection.style.display = "block";
  }

  await loadProducts();
}


// ==========================
// LOGIN
// ==========================

loginForm?.addEventListener("submit", async (e) => {

  e.preventDefault();

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  loginMessage.textContent = "Logging in...";

  const { error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {

    loginMessage.textContent =
      error.message;

    return;
  }

  loginMessage.textContent =
    "Login successful.";

  await showDashboard();
});


// ==========================
// LOGOUT
// ==========================

logoutBtn?.addEventListener("click", async () => {

  await supabaseClient.auth.signOut();

  showLogin();
});


// ==========================
// ADD PRODUCT
// ==========================

productForm?.addEventListener("submit", async (e) => {

  e.preventDefault();

  productMessage.textContent =
    "Uploading product...";

  try {

    const title =
      document.getElementById("productTitle")
        .value.trim();

    const description =
      document.getElementById("productDescription")
        .value.trim();

    const price =
      Number(
        document.getElementById("productPrice").value
      );

    const category =
      document.getElementById("productCategory")
        .value.trim();

    const featured =
      document.getElementById("featuredProduct")
        .checked;

    const imageInput =
      document.getElementById("productImage");

    const fileInput =
      document.getElementById("productFile");


    if (!title) {
      throw new Error("Product title is required.");
    }

    if (!Number.isFinite(price) || price < 0) {
      throw new Error("Enter a valid price.");
    }

    if (!fileInput.files.length) {
      throw new Error("Select the digital product file.");
    }


    // ==========================
    // SLUG
    // ==========================

    const slug =
      createSlug(title) +
      "-" +
      Date.now();


    // ==========================
    // IMAGE UPLOAD
    // ==========================

    let imageUrl = null;

    if (imageInput.files.length) {

      const imageFile =
        imageInput.files[0];

      const imagePath =
        `products/${Date.now()}-${cleanName(imageFile.name)}`;

      const { error: imageError } =
        await supabaseClient.storage
          .from("product-images")
          .upload(
            imagePath,
            imageFile,
            {
              cacheControl: "3600",
              upsert: false
            }
          );

      if (imageError) {
        throw imageError;
      }

      const { data } =
        supabaseClient.storage
          .from("product-images")
          .getPublicUrl(imagePath);

      imageUrl =
        data.publicUrl;
    }


    // ==========================
    // DIGITAL FILE UPLOAD
    // ==========================

    const digitalFile =
      fileInput.files[0];

    const filePath =
      `products/${Date.now()}-${cleanName(digitalFile.name)}`;

    const { error: fileError } =
      await supabaseClient.storage
        .from("digital-products")
        .upload(
          filePath,
          digitalFile,
          {
            cacheControl: "3600",
            upsert: false
          }
        );

    if (fileError) {
      throw fileError;
    }


    // ==========================
    // FILE URL
    // ==========================

    const { data: fileData } =
      supabaseClient.storage
        .from("digital-products")
        .getPublicUrl(filePath);

    const fileUrl =
      fileData.publicUrl;


    // ==========================
    // SAVE PRODUCT
    // ==========================

    const { error: productError } =
      await supabaseClient
        .from("products")
        .insert({

          title: title,

          slug: slug,

          description: description,

          price: price,

          category: category || null,

          image_url: imageUrl,

          file_url: fileUrl,

          featured: featured,

          published: true,

          created_at:
            new Date().toISOString()

        });

    if (productError) {
      throw productError;
    }


    // ==========================
    // SUCCESS
    // ==========================

    productMessage.textContent =
      "✅ Product published successfully!";

    productForm.reset();

    await loadProducts();

  } catch (error) {

    console.error(error);

    productMessage.textContent =
      "❌ " +
      (error.message ||
        "Something went wrong.");

  }

});


// ==========================
// LOAD PRODUCTS
// ==========================

async function loadProducts() {

  if (!adminProducts) return;

  adminProducts.innerHTML =
    "<p>Loading products...</p>";

  const { data, error } =
    await supabaseClient
      .from("products")
      .select("*")
      .order(
        "created_at",
        { ascending: false }
      );

  if (error) {

    console.error(error);

    adminProducts.innerHTML =
      "<p>Unable to load products.</p>";

    return;
  }

  if (!data || data.length === 0) {

    adminProducts.innerHTML =
      "<p>No products yet.</p>";

    return;
  }


  adminProducts.innerHTML =
    data.map(product => `

      <div class="admin-product">

        <img
          src="${
            product.image_url ||
            "https://via.placeholder.com/300x200"
          }"
          alt="${escapeHTML(product.title)}"
        >

        <div>

          <h3>
            ${escapeHTML(product.title)}
          </h3>

          <p>
            ${escapeHTML(
              product.description || ""
            )}
          </p>

          <strong>
            $${Number(product.price || 0).toFixed(2)}
          </strong>

          <p>
            ${
              product.published
                ? "🟢 Published"
                : "🟡 Draft"
            }
          </p>

          <button
            onclick="deleteProduct(${product.id})"
          >
            Delete
          </button>

        </div>

      </div>

    `).join("");
}


// ==========================
// DELETE PRODUCT
// ==========================

async function deleteProduct(id) {

  if (
    !confirm(
      "Are you sure you want to delete this product?"
    )
  ) {
    return;
  }

  const { error } =
    await supabaseClient
      .from("products")
      .delete()
      .eq("id", id);

  if (error) {

    alert(error.message);

    return;
  }

  await loadProducts();
}


// ==========================
// REFRESH
// ==========================

refreshProducts?.addEventListener(
  "click",
  loadProducts
);


// ==========================
// HELPERS
// ==========================

function createSlug(text) {

  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


function cleanName(name) {

  return name
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    );
}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
