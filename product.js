// product.js

let currentProduct = null;


// =====================================
// LOAD PRODUCT
// =====================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await loadProduct();

  }
);


async function loadProduct() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const productId =
    params.get("id");


  if (!productId) {

    showError(
      "Product ID missing."
    );

    return;

  }


  try {

    const {
      data: product,
      error
    } =
      await supabaseClient
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("published", true)
        .single();


    if (error) {
      throw error;
    }


    if (!product) {

      showError(
        "Product not found."
      );

      return;

    }


    currentProduct =
      product;


    displayProduct(
      product
    );


  } catch (error) {

    console.error(
      "Product loading error:",
      error
    );


    showError(
      error.message
    );

  }

}


// =====================================
// DISPLAY PRODUCT
// =====================================

function displayProduct(
  product
) {

  const title =
    document.getElementById(
      "productTitle"
    );


  const description =
    document.getElementById(
      "productDescription"
    );


  const price =
    document.getElementById(
      "productPrice"
    );


  const category =
    document.getElementById(
      "productCategory"
    );


  const image =
    document.getElementById(
      "productImage"
    );


  if (title) {

    title.textContent =
      product.title || "";

  }


  if (description) {

    description.textContent =
      product.description || "";

  }


  if (price) {

    price.textContent =
      "$" +
      Number(
        product.price || 0
      ).toFixed(2);

  }


  if (category) {

    category.textContent =
      product.category ||
      "Digital Product";

  }


  if (image) {

    image.src =
      product.image_url ||
      "https://via.placeholder.com/600x400?text=Product";


    image.alt =
      product.title || "Product";


    image.onerror =
      function () {

        this.src =
          "https://via.placeholder.com/600x400?text=Image+Error";

      };

  }


  // ===================================
  // BUY NOW BUTTON
  // ===================================

  const buyButton =
    document.getElementById(
      "buyNowButton"
    );


  if (buyButton) {

    buyButton.textContent =
      "Buy Now";


    buyButton.disabled =
      false;


    buyButton.onclick =
      function () {

        goToCheckout(
          product.id
        );

      };

  }


  const loading =
    document.getElementById(
      "loading"
    );


  if (loading) {

    loading.style.display =
      "none";

  }


  const productPage =
    document.getElementById(
      "productPage"
    );


  if (productPage) {

    productPage.style.display =
      "block";

  }

}


// =====================================
// GO TO CHECKOUT
// =====================================

function goToCheckout(
  productId
) {

  if (!productId) {

    alert(
      "Product ID is missing."
    );

    return;

  }


  window.location.href =
    "checkout.html?id=" +
    encodeURIComponent(
      productId
    );

}


// =====================================
// ERROR
// =====================================

function showError(
  message
) {

  const loading =
    document.getElementById(
      "loading"
    );


  if (loading) {

    loading.style.display =
      "none";

  }


  const error =
    document.getElementById(
      "productError"
    );


  if (error) {

    error.style.display =
      "block";


    error.textContent =
      message ||
      "Unable to load product.";

    return;

  }


  alert(
    message ||
    "Unable to load product."
  );

}
