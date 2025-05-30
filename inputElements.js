document.addEventListener('DOMContentLoaded', () => {
    window.applyDropdownListeners();
})
window.applyDropdownListeners = function() {
    const selectElements = document.querySelectorAll(".dropdown");

    selectElements.forEach(dropdown => {
        if (!dropdown.dataset.listenerAdded) {
            dropdown.addEventListener('click', function(e) {
                //Check if the plus button is clcked
                if (e.target.classList.contains("dropdownPlus") || e.target.classList.contains("dropdown")) {
                    return;
                }

                //Basically only visual changes, with classes
                if (!dropdown.querySelector(".options").classList.contains("show")) {
                    openDropdown();
                } else {
                    closeDropdown();
                };
                
                // Actualy selecting function
                if (e.target.classList.contains("option")) {
                    if (dropdown.querySelector(".selected")) dropdown.querySelector(".selected").classList.remove("selected");
                    e.target.classList.add("selected");

                    const selectedValue = dropdown.querySelector(".selectedValue");

                    selectedValue.textContent = e.target.textContent;
                    selectedValue.style.backgroundColor = getComputedStyle(e.target).getPropertyValue('--tag-bg').trim();;
                    selectedValue.style.color = getComputedStyle(e.target).getPropertyValue('--tag-color').trim();;
                }
            })

            document.querySelectorAll(".dropdownBackground").forEach(background => {
                background.addEventListener("click", (e) => {
                    if (!dropdown.contains(e.target)) { // If not clicking the dropdown, then run the script
                        closeDropdown();
                    }
                });
            });

            function closeDropdown() {
                const background = dropdown.previousSibling.previousSibling;
                dropdown.classList.remove("selecting");
                dropdown.querySelector(".options").classList.remove("show");
                background.classList.remove("show");
            }

            function openDropdown() {
                const background = dropdown.previousSibling.previousSibling;
                dropdown.classList.add("selecting");
                dropdown.querySelector(".options").classList.add("show")
                background.classList.add("show");
            }
            dropdown.dataset.listenerAdded = "true";
        }
        });
}