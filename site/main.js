// Filter the app cards by category, and keep the footer year current.
document.getElementById("year").textContent = new Date().getFullYear();

const buttons = document.querySelectorAll(".filters button");
const cards = document.querySelectorAll(".card[data-category]");
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    cards.forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
});
