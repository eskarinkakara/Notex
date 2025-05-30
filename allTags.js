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

document.getElementById("newTag").addEventListener('click', () => {
    newTag();
})

//Creates a new tag
function newTag(id = null) {
    const name = id ? document.getElementById(`headerTag${id}`)?.value : document.getElementById("headerTag").value;
    const backgroundColor = id ? document.getElementById(`backgroundColorTag${id}`)?.value : document.getElementById("backgroundColorTag").value;
    const textColor = id ? document.getElementById(`textColorTag${id}`)?.value : document.getElementById("textColorTag").value;

    if (!name) {
        error.textContent = "Tag name is missing.";
        error.classList.add("show");
        clearTimeout(errorTimeout);
        errorTimeout = setTimeout(() => {
            error.classList.remove("show");
        }, 3000);
        return;
    }

    const tagData = {
        name: name,
        backgroundColor: backgroundColor,
        textColor: textColor
    };

    const transaction = db.transaction("tags", "readwrite");
    const store = transaction.objectStore("tags");
    
    let completed = 0;
    let notes;
    if (id) {
        console.log(id)
        const getTagRequest = store.get(Number(id));
        getTagRequest.onsuccess = () => {
            tagData.id = Number(id);

            const tag = getTagRequest.result;
            const tagName = tag.name;

            const transactionNotes = db.transaction("notes", "readwrite")
            const storeNotes = transactionNotes.objectStore("notes");
            const index = storeNotes.index("tag");

            const request = index.getAll(`${tagName}`);
            
            request.onsuccess = (event) => {
                notes = event.target.result;

                if (!notes.length) {
                    loadNotesAndTags();
                    const updateTransaction = db.transaction("tags", "readwrite");
                    const updateStore = updateTransaction.objectStore("tags");
                    updateStore.put(tagData);
                    
                    updateTransaction.oncomplete = () => {
                        popup.textContent = "Tag updated!";
                        popup.classList.add("show");
                        clearTimeout(popupTimeout);
                        popupTimeout = setTimeout(() => {
                            popup.classList.remove("show");
                        }, 2000);
                            loadNotesAndTags();
                    }
                    return;
                }


                notes.forEach(note => {
                    const putRequest = storeNotes.put({ ...note, tag: name });
                    
                    putRequest.onsuccess = () => {
                        completed++;
                        if (completed === notes.length) {
                            const updateTransaction = db.transaction("tags", "readwrite");
                            const updateStore = updateTransaction.objectStore("tags");
                            updateStore.put(tagData);
                            
                            updateTransaction.oncomplete = () => {
                                popup.textContent = "Tag updated!";
                                popup.classList.add("show");
                                clearTimeout(popupTimeout);
                                popupTimeout = setTimeout(() => {
                                    popup.classList.remove("show");
                                }, 2000);
                                    loadNotesAndTags();
                            }
                        }
                    };


                    putRequest.onerror = () => {
                        error.textContent = "Failed to update note while updating tag.";
                        error.classList.add("show");
                        clearTimeout(errorTimeout);
                        errorTimeout = setTimeout(() => {
                            error.classList.remove("show");
                        }, 3000);
                    };
                });
            };
        };
    } else {
        store.put(tagData);

        transaction.oncomplete = () => {
            popup.textContent = "Tag created!";
            popup.classList.add("show");
            clearTimeout(popupTimeout);
            popupTimeout = setTimeout(() => {
                popup.classList.remove("show");
            }, 2000);
            loadNotesAndTags();
        };
        

        transaction.onerror = () => {
            error.textContent = "Failed to create/update tag.";
            error.classList.add("show");
            clearTimeout(errorTimeout);
            errorTimeout = setTimeout(() => {
                error.classList.remove("show");
            }, 3000);
        };
    }
}


//loads the text automatically when database is ready
request.onsuccess = function (event) {
    db = event.target.result;
    loadNotesAndTags();
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


function loadNotesAndTags() {
    const transaction = db.transaction("tags", "readonly");
    const store = transaction.objectStore("tags");
    const request = store.openCursor();
    
    let tags = [];
    let tagObjects = {};
    request.onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
            const tag = cursor.value;
            tags.push(tag.name);
            tagObjects[tag.name] = tag;
            cursor.continue();
        }
    }

    transaction.oncomplete = () => {
            loadNotesByTags(tags, tagObjects);
        }

    request.onerror = () => {
        error.textContent = "Failed to load tags.";
        error.classList.add("show");
        clearTimeout(errorTimeout);
        errorTimeout = setTimeout(() => {
            error.classList.remove("show");
        }, 3000);
        return;
    };
}

function loadNotesByTags(tags, tagObjects) {
    document.getElementById("deleteModals").innerHTML = "";
    document.getElementById("tagContainer").innerHTML = "";
    let completed = 0;
    tags.forEach(tag => {
                //creates tag div
                const tagDiv = document.createElement("div");
                tagDiv.classList.add("tag");
                tagDiv.id = `tagDiv${tag}`;

                //get the stly from the tag
                const tagColor = tagObjects[tag];
                const tagStyle = `
                    background-color: ${tagColor.backgroundColor};
                    color: ${tagColor.textColor};
                `;

                //Creates tag Header
                const tagHeader = document.createElement("h2");
                tagHeader.textContent = tag;
                tagHeader.style.backgroundColor = tagColor.backgroundColor;
                tagHeader.style.color = tagColor.textColor;
                tagHeader.classList.add("btn", "tagHeader", "openModal")
                tagHeader.setAttribute("modalId", `tag${tagObjects[tag].id}`);
                tagDiv.appendChild(tagHeader);

                //Creates delete popup for tags
                const deleteModal = document.createElement("div");
                deleteModal.classList.add("modalBackground");
                deleteModal.setAttribute("modalId", `deleteTag${tagObjects[tag].id}`);
                deleteModal.innerHTML = `<div class="modal top" id="deleteTag${tagObjects[tag].id}">
            <div class="modalContent">
                <h1>ARE YOU SURE?</h1>
                <h3>This will DELETE all notes associated with this tag. This cannot be undone.</h3>
                <div class="btnRow">
                    <input type="submit" class="closeModal" modalId="deleteTag${tagObjects[tag].id}" value="Cancel">
                    <input type="submit" class="deleteBtn deleteTag closeModal" delete="${tagObjects[tag].id}" modalId="deleteTag${tagObjects[tag].id},tag${tagObjects[tag].id}" value="DELETE">
                </div>
            </div>
        </div>`;

                document.getElementById("deleteModals").appendChild(deleteModal);


                //Creates tag editing modal
                    const tagModal = document.createElement("div");
                    tagModal.classList.add("modalBackground");
                    tagModal.setAttribute("modalId", `tag${tagObjects[tag].id}`)
                    tagModal.innerHTML = `<div class="modal center small" id="tag${tagObjects[tag].id}">
            <div class="modalContent">
                <h2>Edit tag</h2>

                <input type="text" class="header" placeholder="Header..." id="headerTag${tagObjects[tag].id}" value="${tag}" style="${tagStyle}">

                <div class="colorContainer">
                    <div class="color">
                        <h4>Background</h4>
                        <input type="color" name="backgroundColor" id="backgroundColorTag${tagObjects[tag].id}" value="${tagColor.backgroundColor}">
                    </div>

                    <div class="color">
                        <h4>Text</h4>
                        <input type="color" name="textColor" id="textColorTag${tagObjects[tag].id}" value="${tagColor.textColor}">
                    </div>
                </div>


                <div class="btnRow">
                    <input type="submit" class="openModal" modalId="deleteTag${tagObjects[tag].id}" value="Delete">
                    <input type="submit" id="${tagObjects[tag].id}" class="closeModal save updateTag" modalId="tag${tagObjects[tag].id}" value="Save">
                </div>
            </div>
        </div>`;
                document.getElementById("tagModals").appendChild(tagModal);
                document.getElementById("tagContainer").appendChild(tagDiv);

        request.onerror = () => {
            error.textContent = "Failed to load tags.";
            error.classList.add("show");
            clearTimeout(errorTimeout);
            errorTimeout = setTimeout(() => {
                error.classList.remove("show");
            }, 3000);
        };
    });
                applyModalListeners();
                applyDropdownListeners();
        

                document.querySelectorAll(".updateNote").forEach(note => {
                    if (!note.dataset.listenerUpdate) {
                        note.addEventListener("click", () => {
                            newNote(note.id);
                        });
                        note.dataset.listenerUpdate = "true";
                    }
                });

                document.querySelectorAll(".deleteBtn.deleteNote").forEach(note => {
                    if (!note.dataset.listenerDelete) {
                        note.addEventListener("click", () => {
                            deleteNote(note.getAttribute("delete"));
                        });
                        note.dataset.listenerDelete = "true";
                    }
                });
        

                document.querySelectorAll(".updateTag").forEach(updTag => {
                    if (!updTag.dataset.listenerUpdate) {
                        updTag.addEventListener("click", () => {
                            newTag(updTag.id);
                        });
                        updTag.dataset.listenerUpdate = "true";
                    }
                });

                document.querySelectorAll(".deleteBtn.deleteTag").forEach(delTag => {
                    if (!delTag.dataset.listenerDelete) {
                        delTag.addEventListener("click", () => {
                            deleteTag(delTag.getAttribute("delete"));
                        });
                        delTag.dataset.listenerDelete = "true";
                    }
                });
}
function deleteTag(id) {
    const transaction = db.transaction("tags", "readwrite");
    const store = transaction.objectStore("tags");
    
    
    const getTagRequest = store.get(Number(id));
    getTagRequest.onsuccess = () => {
        console.log(id)
        const tag = getTagRequest.result;
        const tagName = tag.name;

        //Delete notes too
        const transactionNotes = db.transaction("notes", "readwrite")
        const storeNotes = transactionNotes.objectStore("notes");
        const index = storeNotes.index("tag");

        const request = index.getAll(`${tagName}`);
        
        request.onsuccess = (event) => {
            const notes = event.target.result;

            if (!notes.length) {
                loadNotesAndTags();
                return;
            }

            let completed = 0;

            notes.forEach(note => {
                storeNotes.delete(note.id);
            });
        };
    };

    //Deletes the tag
    store.delete(Number(id));


    transaction.oncomplete = () => {
        popup.textContent = "Tag deleted!";
        popup.classList.add("show");
        clearTimeout(popupTimeout);
        popupTimeout = setTimeout(() => {
            popup.classList.remove("show");
        }, 2000);
        loadNotesAndTags();
    };
    

    request.onerror = () => {
            error.textContent = "Failed to delete tag.";
            error.classList.add("show");
            clearTimeout(errorTimeout);
            errorTimeout = setTimeout(() => {
                error.classList.remove("show");
            }, 3000);
    };
}