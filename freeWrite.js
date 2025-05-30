// opens or creates the database
let db;
const request = indexedDB.open("NotexDB", 1);
request.onupgradeneeded = function (event) {
    db = event.target.result;

    if (!db.objectStoreNames.contains("notes")) {
        const notesStore = db.createObjectStore("notes", { keyPath: "id", autoIncrement: true });
        notesStore.createIndex("header", "header");
        notesStore.createIndex("tag", "tag");
    }

    if (!db.objectStoreNames.contains("tags")) {
        const tagsStore = db.createObjectStore("tags", { keyPath: "id", autoIncrement: true });
        tagsStore.createIndex("name", "name", { unique: true });
    }

    if (!db.objectStoreNames.contains("freeWrite")) {
        db.createObjectStore("freeWrite", { keyPath: "id" });
    }
};


//loads the text automatically when database is ready
request.onsuccess = function (event) {
    db = event.target.result;
    loadFreeWriteText();
};

request.onerror = function () {
    error.textContent = "Failed to open database.";
    error.classList.add("show");
    clearTimeout(errorTimeout);
    errorTimeout = setTimeout(() => {
        error.classList.remove("show");
    }, 3000);
};

const popup = document.getElementById("popup");
let popupTimeout;

popup.addEventListener('click', () => {
    clearTimeout(popupTimeout);
    popup.classList.remove("show");
})

const error = document.getElementById("error");
let errorTimeout;

error.addEventListener('click', () => {
    clearTimeout(errorTimeout);
    error.classList.remove("show");
})

// save main text
document.getElementById("saveFreeWrite").addEventListener("click", () => {
    const text = document.getElementById("freeWrite").value;

    const transaction = db.transaction("freeWrite", "readwrite");
    const store = transaction.objectStore("freeWrite");

    // Save or overwrite text with ID "main"
    store.put({ id: "main", text: text });

    transaction.oncomplete = () => {
        popup.textContent = "Text saved!";
        popup.classList.add("show");
        clearTimeout(popupTimeout);
        popupTimeout = setTimeout(() => {
        popup.classList.remove("show");
        }, 2000);
    };

    transaction.onerror = () => {
        error.textContent = "Failed to save text.";
        error.classList.add("show");
        clearTimeout(errorTimeout);
        errorTimeout = setTimeout(() => {
            error.classList.remove("show");
        }, 3000);
    };
});

// save backup text
document.getElementById("saveBackup").addEventListener("click", () => {
    const text = document.getElementById("freeWrite").value;

    const transaction = db.transaction("freeWrite", "readwrite");
    const store = transaction.objectStore("freeWrite");

    // Save or overwrite text with ID "backup"
    store.put({ id: "backup", text: text });

    transaction.oncomplete = () => {
        popup.textContent = "Backup saved!";
        popup.classList.add("show");
        clearTimeout(popupTimeout);
        popupTimeout = setTimeout(() => {
        popup.classList.remove("show");
        }, 2000);
    };

    transaction.onerror = () => {
        error.textContent = "Failed to save text backup.";
        error.classList.add("show");
        clearTimeout(errorTimeout);
        errorTimeout = setTimeout(() => {
            error.classList.remove("show");
        }, 3000);
    };
});

// load main text
document.getElementById("loadFreeWrite").addEventListener("click", () => {
    loadFreeWriteText("main", true);
    popup.textContent = "Text loaded!";
});

// load backup text
document.getElementById("loadBackup").addEventListener("click", () => {
    loadFreeWriteText("backup", true);
    popup.textContent = "Backup loaded!";
});

// loads text from given id and shows popup if needed
function loadFreeWriteText(id = "main", showPopup = false) {
    const transaction = db.transaction("freeWrite", "readonly");
    const store = transaction.objectStore("freeWrite");

    const request = store.get(`${id}`);

    request.onsuccess = () => {
        if (request.result) {
            document.getElementById("freeWrite").value = request.result.text;
            if (showPopup) {
                popup.classList.add("show");
            clearTimeout(popupTimeout);
            popupTimeout = setTimeout(() => {
                popup.classList.remove("show");
                }, 2000);
            }
        }
    };

    request.onerror = () => {
        error.textContent = "Failed to load saved text.";
        error.classList.add("show");
        clearTimeout(errorTimeout);
        errorTimeout = setTimeout(() => {
            error.classList.remove("show");
        }, 3000);
    };
}
