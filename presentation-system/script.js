const deck = document.getElementById("deck");
const deckFrame = document.getElementById("deckFrame");
const slides = Array.from(document.querySelectorAll(".slide"));
const prevButton = document.getElementById("prevSlide");
const nextButton = document.getElementById("nextSlide");
const slideIndex = document.getElementById("slideIndex");
const slideTitle = document.getElementById("slideTitle");
const progressBar = document.getElementById("progressBar");

let currentSlide = 0;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

function setDeckScale() {
  const scale = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
  deckFrame.style.setProperty("--deck-scale", String(scale));
  deck.style.setProperty("--deck-scale", String(scale));
}

function showSlide(index) {
  currentSlide = Math.max(0, Math.min(index, slides.length - 1));
  slides.forEach((slide, slideNumber) => {
    slide.classList.toggle("active", slideNumber === currentSlide);
  });
  slideIndex.textContent = String(currentSlide + 1).padStart(2, "0");
  slideTitle.textContent = slides[currentSlide].dataset.title || "Slide";
  progressBar.style.width = `${((currentSlide + 1) / slides.length) * 100}%`;
}

function monthlyPayment(principal, annualRate, months = 360) {
  const rate = annualRate / 100 / 12;
  if (!rate) return principal / months;
  const factor = Math.pow(1 + rate, months);
  return principal * rate * factor / (factor - 1);
}

function numberValue(id) {
  return Number(document.getElementById(id).value);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function updateCalculators() {
  const price = numberValue("priceInput");
  const downPercent = numberValue("downInput");
  const rate = numberValue("rateInput");
  const income = numberValue("incomeInput");
  const loanAmount = price * (1 - downPercent / 100);
  const pi = monthlyPayment(loanAmount, rate);
  const taxes = price * 0.0068 / 12;
  const insurance = price * 0.0024 / 12;
  const pmi = downPercent < 20 ? loanAmount * 0.0048 / 12 : 0;
  const payment = pi + taxes + insurance + pmi;
  const dti = payment / income * 100;
  const cashToClose = price * downPercent / 100 + price * 0.025;

  setText("priceValue", money.format(price));
  setText("downValue", `${downPercent}%`);
  setText("rateValue", `${rate.toFixed(3)}%`);
  setText("incomeValue", money.format(income));
  setText("piValue", money.format(pi));
  setText("paymentValue", money.format(payment));
  setText("calcHeadline", `${money.format(payment)} / month`);
  setText("ringPayment", money.format(payment));
  setText("dtiValue", `${Math.round(dti)}%`);
  setText("miniDti", `${Math.round(dti)}%`);
  setText("cashValue", money.format(cashToClose));
  setText("miniCash", `${money.format(cashToClose / 1000)}k`);

  const rent = numberValue("rentInput");
  const buyPrice = numberValue("buyPriceInput");
  const buyLoan = buyPrice * 0.95;
  const ownership = monthlyPayment(buyLoan, 6.5) + buyPrice * 0.0092 / 12;
  const gap = ownership - rent;

  setText("rentValue", money.format(rent));
  setText("buyPriceValue", money.format(buyPrice));
  setText("ownershipValue", money.format(ownership));
  setText("rentGapValue", `${gap >= 0 ? "" : "-"}${money.format(Math.abs(gap))}`);
}

prevButton.addEventListener("click", () => showSlide(currentSlide - 1));
nextButton.addEventListener("click", () => showSlide(currentSlide + 1));

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
    event.preventDefault();
    showSlide(currentSlide + 1);
  }
  if (event.key === "ArrowLeft" || event.key === "PageUp") {
    event.preventDefault();
    showSlide(currentSlide - 1);
  }
  if (event.key === "Home") {
    event.preventDefault();
    showSlide(0);
  }
  if (event.key === "End") {
    event.preventDefault();
    showSlide(slides.length - 1);
  }
});

document.querySelectorAll("input[type='range']").forEach((input) => {
  input.addEventListener("input", updateCalculators);
});

window.addEventListener("resize", setDeckScale);

setDeckScale();
showSlide(0);
updateCalculators();
