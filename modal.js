document.addEventListener("DOMContentLoaded", () => {

    const searchbar = document.getElementById("searchbar");

    if (searchbar) {
        ['focus','input'].forEach( function(evt) {
            searchbar.addEventListener(evt, function() {

                let loltime; //delete
                const lols = document.querySelectorAll(".lol"); //delete

                clearTimeout(loltime); //delete
                lols.forEach(lol => { //delete
                    lol.classList.remove("show"); //delete
                    lol.classList.add("hide"); //delete
                }); //delete

                async function loll() { //delete
                    for (const lol of lols) { //delete
                        await new Promise(resolve => setTimeout(resolve, 10000)); //delete
                        lol.classList.add("show"); //delete
                        lol.classList.remove("hide"); //delete
                    } //delete
                } //delete

                if (searchbar.value.length > 0) {
                    openModal(searchbar.getAttribute("modalId"));

                    loll(); //delete

                } else {
                    closeModal(searchbar.getAttribute("modalId"));
                }
            });
        });
    }
    applyModalListeners();
});


    function openModal(modalId) {
        const ids = modalId.split(",");
        ids.forEach(id => {
            id = id.trim();
            document.getElementById(id).classList.add("show");
            const background = document.querySelector(`.modalBackground[modalId="${id}"]`);
            background.classList.add("show");
            document.body.classList.add("modalOpen");
        });
    }

    function closeModal(modalId) {
        const ids = modalId.split(",");
        ids.forEach(id => {
            id = id.trim();
            document.getElementById(id).classList.remove("show");
            const background = document.querySelector(`.modalBackground[modalId="${id}"]`);
            background.classList.remove("show");

            const modalsOpen = document.querySelectorAll(".modal.show");
            if (modalsOpen.length === 0) {
                document.body.classList.remove("modalOpen");
            }
        });
    }


window.applyModalListeners = function() {
    document.querySelectorAll(".openModal").forEach(button => {
        if (!button.dataset.listenerAdded) {
            button.addEventListener("click", () => {
                openModal(button.getAttribute("modalId"));
            });
            button.dataset.listenerAdded = "true";
        }
    });

    document.querySelectorAll(".closeModal").forEach(button => {
        if (!button.dataset.listenerAdded) {
            button.addEventListener("click", () => {
                closeModal(button.getAttribute("modalId"));
            });
            button.dataset.listenerAdded = "true";
        }
    });

    document.querySelectorAll(".modalBackground").forEach(background => {
        if (!background.dataset.listenerAdded) {
        background.dataset.listenerAdded = "true";
            background.addEventListener("click", (e) => {
                const modal = background.querySelector(".modal");
                if (!modal.contains(e.target)) {
                    closeModal(background.getAttribute("modalId"));
                }
            });
            background.dataset.listenerAdded = "true";
        }
    });

    document.querySelectorAll(".reminderCheck").forEach(button => {
        if (!button.dataset.listenerAdded) {
            const checkbox = button.querySelector("[type='checkbox']");
            let timeoutId;
            let isWaiting;
            ['mousedown', 'touchstart'].forEach(evt => {
                button.addEventListener(evt, function () {
                    isWaiting = true
                    timeoutId = setTimeout(() => {
                        isWaiting = false;
                        checkbox.checked = true;
                        openModal("reminderSettings");
                    }, 500)
                });
            });
            ['mouseup', 'mouseleave', 'touchend'].forEach(evt => {
                button.addEventListener(evt, function (e) {
                    if (isWaiting) {
                        isWaiting = false;
                        clearTimeout(timeoutId);
                        if (e.target.classList.contains("reminderCheck")) checkbox.checked = (checkbox.checked) ? false : true;
                    }
                });
            });
            button.dataset.listenerAdded = "true";
        }
    });
}