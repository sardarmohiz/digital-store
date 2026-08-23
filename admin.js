```javascript
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const productForm = document.getElementById("productForm");
const productMessage = document.getElementById("productMessage");

const adminProducts = document.getElementById("adminProducts");
const adminOrders = document.getElementById("adminOrders");

const logoutBtn = document.getElementById("logoutBtn");
const refreshProducts = document.getElementById("refreshProducts");
const refreshOrders = document.getElementById("refreshOrders");

const paymentSettingsForm =
  document.getElementById("paymentSettingsForm");

const paymentSettingsMessage =
  document.getElementById("paymentSettingsMessage");


document.addEventListener("DOMContentLoaded", function () {
  checkLogin();
});


async function checkLogin() {

  try {

    const result =
      await supabaseClient.auth.getSession();

    if (result.data && result.data.session) {
      showDashboard();
    } else {
      showLogin();
    }

  } catch (error) {

    console.error(error);
    showLogin();

  }

}


function showLogin() {

  if (loginSection) {
    loginSection.style.display = "block";
  }

  if (dashboardSection) {
    dashboardSection.style.display = "none";
  }

}


async function showDashboard() {

  if (loginSection) {
    loginSection.style.display = "none";
  }

  if (dashboardSection) {
    dashboardSection.style.display = "block";
  }

  await loadPaymentSettings();
  await loadProducts();
  await loadOrders();

}


loginForm?.addEventListener("submit", async function (event) {

  event.preventDefault();

  loginMessage.textContent = "Logging in...";

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  try {

    const result =
      await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (result.error) {
      loginMessage.textContent =
        result.error.message;
      return;
    }

    loginMessage.textContent =
      "Login successful.";

    await showDashboard();

  } catch (error) {

    loginMessage.textContent =
      error.message;

  }

});


logoutBtn?.addEventListener("click", async function () {

  await supabaseClient.auth.signOut();

  showLogin();

});


async function loadPaymentSettings() {

  if (!paymentSettingsForm) {
    return;
  }

  try {

    const result =
      await supabaseClient
        .from("payment_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

    if (result.error) {

      console.log(
        "Payment settings error:",
        result.error.message
      );

      return;
    }

    if (!result.data) {
      return;
    }

    const data = result.data;

    const epName =
      document.getElementById("easypaisaName");

    const epNumber =
      document.getElementById("easypaisaNumber");

    const jcName =
      document.getElementById("jazzcashName");

    const jcNumber =
      document.getElementById("jazzcashNumber");


    if (epName) {
      epName.value =
        data.easypaisa_name || "";
    }

    if (epNumber) {
      epNumber.value =
        data.easypaisa_number || "";
    }

    if (jcName) {
      jcName.value =
        data.jazzcash_name || "";
    }

    if (jcNumber) {
      jcNumber.value =
        data.jazzcash_number || "";
    }

  } catch (error) {

    console.log(error);

  }

}


paymentSettingsForm?.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();

    paymentSettingsMessage.textContent =
      "Saving...";

    try {

      const values = {

        easypaisa_name:
          document
            .getElementById("easypaisaName")
            .value
            .trim(),

        easypaisa_number:
          document
            .getElementById("easypaisaNumber")
            .value
            .trim(),

        jazzcash_name:
          document
            .getElementById("jazzcashName")
            .value
            .trim(),

        jazzcash_number:
          document
            .getElementById("jazzcashNumber")
            .value
            .trim(),

        updated_at:
          new Date().toISOString()

      };


      const existing =
        await supabaseClient
          .from("payment_settings")
          .select("id")
          .limit(1)
          .maybeSingle();


      if (existing.error) {
        throw existing.error;
      }


      let result;


      if (existing.data) {

        result =
          await supabaseClient
            .from("payment_settings")
            .update(values)
            .eq(
              "id",
              existing.data.id
            );

      } else {

        result =
          await supabaseClient
            .from("payment_settings")
            .insert(values);

      }


      if (result.error) {
        throw result.error;
      }


      paymentSettingsMessage.textContent =
        "Payment details saved successfully.";

    } catch (error) {

      paymentSettingsMessage.textContent =
        "Error: " + error.message;

    }

  }
);


productForm?.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();

    productMessage.textContent =
      "Uploading product...";


    try {

      const title =
        document
          .getElementById("productTitle")
          .value
          .trim();

      const description =
        document
          .getElementById("productDescription")
          .value
          .trim();

      const price =
        Number(
          document
            .getElementById("productPrice")
            .value
        );

      const category =
        document
          .getElementById("productCategory")
          .value
          .trim();

      const featured =
        document
          .getElementById("featuredProduct")
          .checked;

      const imageInput =
        document.getElementById("productImage");

      const fileInput =
        document.getElementById("productFile");


      if (!title) {
        throw new Error(
          "Product title is required."
        );
      }

      if (!Number.isFinite(price)) {
        throw new Error(
          "Enter a valid price."
        );
      }

      if (!imageInput.files.length) {
        throw new Error(
          "Please select a product image."
        );
      }

      if (!fileInput.files.length) {
        throw new Error(
          "Please select the digital product file."
        );
      }


      const unique =
        Date.now() +
        "-" +
        Math.random()
          .toString(36)
          .substring(2, 8);


      const imageFile =
        imageInput.files[0];

      const imagePath =
        "products/" +
        unique +
        "-" +
        cleanFileName(
          imageFile.name
        );


      const imageUpload =
        await supabaseClient.storage
          .from("product-images")
          .upload(
            imagePath,
            imageFile,
            {
              cacheControl: "3600",
              upsert: false,
              contentType: imageFile.type
            }
          );


      if (imageUpload.error) {
        throw new Error(
          "Image upload failed: " +
          imageUpload.error.message
        );
      }


      const imagePublic =
        supabaseClient.storage
          .from("product-images")
          .getPublicUrl(
            imagePath
          );


      const imageUrl =
        imagePublic.data.publicUrl;


      const digitalFile =
        fileInput.files[0];

      const filePath =
        "products/" +
        unique +
        "-" +
        cleanFileName(
          digitalFile.name
        );


      const fileUpload =
        await supabaseClient.storage
          .from("digital-products")
          .upload(
            filePath,
            digitalFile,
            {
              cacheControl: "3600",
              upsert: false,
              contentType: digitalFile.type
            }
          );


      if (fileUpload.error) {

        await supabaseClient.storage
          .from("product-images")
          .remove([imagePath]);

        throw new Error(
          "Digital file upload failed: " +
          fileUpload.error.message
        );
      }


      const filePublic =
        supabaseClient.storage
          .from("digital-products")
          .getPublicUrl(
            filePath
          );


      const fileUrl =
        filePublic.data.publicUrl;


      const slug =
        createSlug(title) +
        "-" +
        Date.now();


      const productInsert =
        await supabaseClient
          .from("products")
          .insert({

            title: title,

            slug: slug,

            description: description,

            price: price,

            category:
              category ||
              "Digital Product",

            image_url:
              imageUrl,

            file_url:
              fileUrl,

            featured:
              featured,

            published:
              true,

            created_at:
              new Date().toISOString()

          });


      if (productInsert.error) {

        await supabaseClient.storage
          .from("product-images")
          .remove([imagePath]);

        await supabaseClient.storage
          .from("digital-products")
          .remove([filePath]);

        throw new Error(
          "Database error: " +
          productInsert.error.message
        );

      }


      productMessage.textContent =
        "Product published successfully.";

      productForm.reset();

      await loadProducts();

    } catch (error) {

      console.error(error);

      productMessage.textContent =
        "Error: " + error.message;

    }

  }
);


async function loadProducts() {

  if (!adminProducts) {
    return;
  }

  adminProducts.innerHTML =
    "<p>Loading products...</p>";


  const result =
    await supabaseClient
      .from("products")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (result.error) {

    adminProducts.innerHTML =
      "<p>Error: " +
      escapeHTML(
        result.error.message
      ) +
      "</p>";

    return;

  }


  if (
    !result.data ||
    result.data.length === 0
  ) {

    adminProducts.innerHTML =
      "<p>No products yet.</p>";

    return;

  }


  adminProducts.innerHTML =
    result.data.map(function (product) {

      const image =
        product.image_url ||
        "https://via.placeholder.com/400x250?text=No+Image";


      return (

        "<div style=\"padding:15px;margin-bottom:15px;border:1px solid #ddd;border-radius:12px;\">" +

          "<img src=\"" +
          escapeHTML(image) +
          "\" alt=\"" +
          escapeHTML(product.title) +
          "\" style=\"width:180px;height:120px;object-fit:cover;border-radius:10px;\">" +

          "<h3>" +
          escapeHTML(product.title) +
          "</h3>" +

          "<p>" +
          escapeHTML(
            product.description || ""
          ) +
          "</p>" +

          "<strong>$" +
          Number(
            product.price || 0
          ).toFixed(2) +
          "</strong>" +

          "<br><br>" +

          "<button onclick=\"deleteProduct(" +
          product.id +
          ")\">Delete</button>" +

        "</div>"

      );

    }).join("");

}


async function loadOrders() {

  if (!adminOrders) {
    return;
  }

  adminOrders.innerHTML =
    "<p>Loading orders...</p>";


  const result =
    await supabaseClient
      .from("orders")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (result.error) {

    adminOrders.innerHTML =
      "<p>Error loading orders: " +
      escapeHTML(
        result.error.message
      ) +
      "</p>";

    return;

  }


  if (
    !result.data ||
    result.data.length === 0
  ) {

    adminOrders.innerHTML =
      "<p>No orders received yet.</p>";

    return;

  }


  adminOrders.innerHTML =
    result.data.map(function (order) {

      const orderId =
        order.order_id ||
        order.id ||
        "N/A";

      const customerName =
        order.customer_name ||
        "N/A";

      const customerEmail =
        order.customer_email ||
        "N/A";

      const amount =
        order.amount ||
        0;

      const paymentStatus =
        order.payment_status ||
        "pending";

      const transactionId =
        order.transaction_id ||
        "Not provided";


      return (

        "<div style=\"padding:20px;margin-bottom:15px;border:1px solid #ddd;border-radius:14px;\">" +

          "<h3>Order #" +
          escapeHTML(orderId) +
          "</h3>" +

          "<p><strong>Customer:</strong> " +
          escapeHTML(customerName) +
          "</p>" +

          "<p><strong>Email:</strong> " +
          escapeHTML(customerEmail) +
          "</p>" +

          "<p><strong>Amount:</strong> $" +
          Number(amount).toFixed(2) +
          "</p>" +

          "<p><strong>Payment:</strong> " +
          escapeHTML(paymentStatus) +
          "</p>" +

          "<p><strong>Transaction ID:</strong> " +
          escapeHTML(transactionId) +
          "</p>" +

          "<details>" +

            "<summary>View complete order</summary>" +

            "<pre style=\"white-space:pre-wrap;word-break:break-word;\">" +
            escapeHTML(
              JSON.stringify(
                order,
                null,
                2
              )
            ) +
            "</pre>" +

          "</details>" +

        "</div>"

      );

    }).join("");

}


async function deleteProduct(id) {

  if (!confirm("Delete this product?")) {
    return;
  }


  const result =
    await supabaseClient
      .from("products")
      .delete()
      .eq("id", id);


  if (result.error) {

    alert(result.error.message);

    return;

  }

  await loadProducts();

}


refreshProducts?.addEventListener(
  "click",
  loadProducts
);

refreshOrders?.addEventListener(
  "click",
  loadOrders
);


function cleanFileName(name) {

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


function createSlug(text) {

  return text
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}
```
