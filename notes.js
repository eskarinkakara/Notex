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
    
    //set value to today's date in reminderSettings
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;

    document.getElementById("reminderDate").value = date;


    loadNotesAndTags();
    tagOptions();
    checkRemindersNow();
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
                            tagOptions();
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
                                    tagOptions();
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
                tagOptions();
        };
        

        transaction.onerror = () => {
            error.textContent = "Error. Name has to be unique";
            error.classList.add("show");
            clearTimeout(errorTimeout);
            errorTimeout = setTimeout(() => {
                error.classList.remove("show");
            }, 3000);
        };
    }
}




//Creates a new note or overwrites old one
function newNote(id = null) {
    //get values. if id is set then get values from those instead
    const header = id ? document.getElementById(`header${id}`)?.value : document.getElementById("headerNew").value;
    const text = id ? document.getElementById(`text${id}`)?.value : document.getElementById("textNew").value;
    const tag = id ? document.getElementById(`tagName${id}`)?.textContent.trim() : document.getElementById("tagNameNew").textContent.trim();
    const backgroundColor = id ? document.getElementById(`backgroundColor${id}`)?.value : document.getElementById("backgroundColorNew").value;
    const textColor = id ? document.getElementById(`textColor${id}`)?.value : document.getElementById("textColorNew").value;
    const reminder = id ? document.getElementById(`reminder${id}`)?.checked : document.getElementById("reminderNew").checked;
    const reminderTime = document.getElementById("reminderTime").value;
    const reminderDate = document.getElementById("reminderDate").value;

    if (!tag || tag === "--Select tag--" || !backgroundColor || !textColor || (reminder && (!reminderTime || !reminderDate))) {
            error.textContent = "Some information is missing.";
            error.classList.add("show");
            clearTimeout(errorTimeout);
            errorTimeout = setTimeout(() => {
                error.classList.remove("show");
            }, 3000);
        return;
    }


    //reset the values from reminderSettings, so future reminders use default values instead of old leftover settings
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;

    document.getElementById("reminderTime").value = "17:00"
    document.getElementById("reminderDate").value = date;

    if (!id) {
        document.getElementById("headerNew").value = "";
        document.getElementById("textNew").value = "";
        document.getElementById("backgroundColorNew").value = "#000000";
        document.getElementById("textColorNew").value = "#fefefe";
        document.getElementById("reminderNew").checked = false;
    }

    const transaction = db.transaction("notes", "readwrite");
    const store = transaction.objectStore("notes");
    
    const noteData = {
        header: header,
        text: text,
        tag: tag,
        backgroundColor: backgroundColor,
        textColor: textColor,
        reminder: reminder
    };

    if (reminder) {
        noteData.reminderTime = reminderTime;
        noteData.reminderDate = reminderDate;
    }

    if (id) {
        noteData.id = Number(id);
    }
    store.put(noteData);


    transaction.oncomplete = () => {
        popup.textContent = id ? "Note updated!" : "Note created!";
        popup.classList.add("show");
        clearTimeout(popupTimeout);
        popupTimeout = setTimeout(() => {
        popup.classList.remove("show");
        }, 2000);
        loadNotesAndTags();
    };

    transaction.onerror = () => {
            error.textContent = "Failed to create note.";
            error.classList.add("show");
            clearTimeout(errorTimeout);
            errorTimeout = setTimeout(() => {
                error.classList.remove("show");
            }, 3000);
    };
}

document.getElementById("noteNew").addEventListener("click", () => {
    newNote();
});

function tagOptions() {
    const transaction = db.transaction("tags", "readonly");
    const store = transaction.objectStore("tags");
    const request = store.openCursor();

    const tagDropdowns = document.querySelectorAll(".tags");
    
    let tagOptions = "";
    request.onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
            const tag = cursor.value;
            tagOptions += `<div class="option tagOption" style="--tag-bg: ${tag.backgroundColor}; --tag-color: ${tag.textColor};">${tag.name}</div>`;
            cursor.continue();
        }

        tagDropdowns.forEach(dropdown => {
            dropdown.innerHTML = tagOptions;
        });
    }

    request.onerror = () => {
        error.textContent = "Failed to load tags.";
        error.classList.add("show");
        clearTimeout(errorTimeout);
        errorTimeout = setTimeout(() => {
            error.classList.remove("show");
        }, 3000);
    };
}


//Notifications

function showReminderNotification(note) {
    if (Notification.permission === "granted") {
        new Notification(note.header, {
        body: note.text,
        icon: "Notex_icon.png"
        });

        const updateTransaction = db.transaction("notes", "readwrite");
        const updateStore = updateTransaction.objectStore("notes");
        note.reminder = false;
        updateStore.put(note);
    }
}

if (Notification.permission !== "granted") {
    Notification.requestPermission().then(permission => {
        if (permission !== "granted") {
        console.warn("Notifications not granted.");
        }
    });
}

function checkRemindersNow() {
    const transaction = db.transaction("notes", "readonly");
    const store = transaction.objectStore("notes");
    const request = store.openCursor();

    const now = new Date();

    request.onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
        const note = cursor.value;
        const reminderDateTime = new Date(`${note.reminderDate}T${note.reminderTime}`);
        if (note.reminder && note.reminderDate && note.reminderTime) {
            if (now >= reminderDateTime && note.reminder) {
                showReminderNotification(note);
                loadNotesAndTags();
            }
        }
        cursor.continue();
        }
    };
}

setInterval(() => {
    const transaction = db.transaction("notes", "readonly");
    const store = transaction.objectStore("notes");
    const request = store.openCursor();

    const now = new Date();

    request.onsuccess = event => {
        const cursor = event.target.result;
        if (cursor) {
        const note = cursor.value;
        const reminderDateTime = new Date(`${note.reminderDate}T${note.reminderTime}`);
        if (note.reminder && note.reminderDate && note.reminderTime) {
            if (now >= reminderDateTime && note.reminder) {
                showReminderNotification(note);
                document.getElementById(`reminder${note.id}`).checked = false;
            }
        }
        cursor.continue();
        }
    };
}, 60000);




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
    document.getElementById("noteModals").innerHTML = "";
    document.getElementById("deleteModals").innerHTML = "";
    document.getElementById("tagContainer").innerHTML = "";
    let completed = 0;
    tags.forEach(tag => {
        const transaction = db.transaction("notes", "readonly");
        const store = transaction.objectStore("notes");
        const tagIndex = store.index("tag");

        const request = tagIndex.getAll(`${tag}`);

        request.onsuccess = function (event) {
            const notes = event.target.result;

            if (notes.length > 0) {
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

                //creates the notecontainer
                const noteContainer = document.createElement("div");
                noteContainer.classList.add("noteContainer");
                tagDiv.appendChild(noteContainer);

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


                // creates note
                notes.forEach(note => {                    
                    const tagColor = tagObjects[note.tag];

                    const selectedValueStyle = `
                    background-color: ${tagColor.backgroundColor};
                    color: ${tagColor.textColor};
                    `;


                    const noteDiv = document.createElement("div");
                    noteDiv.classList.add("note", /*`${note.type}`*/"note1", "openModal");
                    noteDiv.setAttribute("modalId", `note${note.id}`)
                    noteDiv.style.backgroundColor = note.backgroundColor;
                    noteDiv.style.color = note.textColor;
                    noteDiv.innerHTML = `<h1 class="noteHeader">${note.header}</h1>
                            <div class="noteText">${note.text}</div>
                        </div>`;
                    noteContainer.appendChild(noteDiv);

                    //Creates note modal
                    const noteModal = document.createElement("div");
                    noteModal.classList.add("modalBackground");
                    noteModal.setAttribute("modalId", `note${note.id}`)
                    noteModal.innerHTML = `<div class="modal center" id="note${note.id}">
            <div class="modalContent">
                <h2>Edit note</h2>

                <input type="text" class="header" placeholder="Header..." id="header${note.id}" value="${note.header}">
                <textarea class="text" placeholder="Text..." id="text${note.id}">${note.text}</textarea>

                <div class="dropdownBackground"></div>
                    <div class="dropdown">
                        <div class="selection">
                            <div class="selectedValue" id="tagName${note.id}" style="${selectedValueStyle}">${note.tag}</div>     <div class="btn dropdownPlus openModal" modalId="createTag"><span class="plus">&#43</span></div>

                            <div class="options tags">
                            </div>
                        </div>
                </div>

                <div class="colorContainer">
                    <div class="color">
                        <h4>Background</h4>
                        <input type="color" name="backgroundColor" id="backgroundColor${note.id}" value="${note.backgroundColor}">
                    </div>

                    <div class="color">
                        <h4>Text</h4>
                        <input type="color" name="textColor" id="textColor${note.id}" value="${note.textColor}">
                    </div>
                </div>

                <div class="reminderCheck">
                    <input type="checkbox" name="reminder${note.id}" id="reminder${note.id}" ${note.reminder ? 'checked="checked"' : ''}>
                    <label for="reminder${note.id}">Reminder</label>
                </div>


                <div class="btnRow">
                    <input type="submit" class="openModal" modalId="delete${note.id}" value="Delete">
                    <input type="submit" id="${note.id}" class="closeModal save updateNote" modalId="note${note.id}" value="Save">
                </div>
                    <input type="submit" class="closeModal" modalId="note${note.id}" value="Cancel">
            </div>
        </div>`;
                document.getElementById("noteModals").appendChild(noteModal);

                const deleteModal = document.createElement("div");
                    deleteModal.classList.add("modalBackground");
                    deleteModal.setAttribute("modalId", `delete${note.id}`);
                    deleteModal.innerHTML = `<div class="modal top" id="delete${note.id}">
            <div class="modalContent">
                <h1>ARE YOU SURE?</h1>
                <h3>This action cannot be undone.</h3>
                <div class="btnRow">
                    <input type="submit" class="closeModal" modalId="delete${note.id}" value="Cancel">
                    <input type="submit" class="deleteBtn deleteNote closeModal" delete="${note.id}" modalId="delete${note.id},note${note.id}" value="DELETE">
                </div>
            </div>
        </div>`;

                document.getElementById("deleteModals").appendChild(deleteModal);
                });

                document.getElementById("tagContainer").appendChild(tagDiv);
            }
        };

        transaction.oncomplete = () => {
            completed++;
            if (completed === tags.length)  {
                applyModalListeners();
                applyDropdownListeners();
                tagOptions();
        

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
        };

        request.onerror = () => {
            error.textContent = "Failed to load notes.";
            error.classList.add("show");
            clearTimeout(errorTimeout);
            errorTimeout = setTimeout(() => {
                error.classList.remove("show");
            }, 3000);
        };
    });
}

// loads notes and checks for tags given.
function loadNotes(tag = null) {
    let noteContainer = tag ? document.querySelector(`#${tag} .noteContainer`) : document.querySelector(`.allNotes .noteContainer`);
    const transaction = db.transaction("notes", "readonly");
    const store = transaction.objectStore("notes");
    const request = store.openCursor();

    let noteHTML = "";
    request.onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
            const note = cursor.value;
            noteHTML += `<div class="note note1 openModal" modalId="note${note.id}" style="background-color: ${note.backgroundColor}; color: ${note.textColor};">
                    <h1 class="noteHeader">${note.header}</h1>
                    <div class="noteText">${note.text}</div>
                </div>`;
            
            cursor.continue();
        }
        noteContainer.innerHTML = noteHTML;
    };

    request.onerror = () => {
            error.textContent = "Failed to load saved notes.";
            error.classList.add("show");
            clearTimeout(errorTimeout);
            errorTimeout = setTimeout(() => {
                error.classList.remove("show");
            }, 3000);
    };
}

function deleteNote(id) {
    const transaction = db.transaction("notes", "readwrite");
    const store = transaction.objectStore("notes");
    
    store.delete(Number(id));

    transaction.oncomplete = () => {
        popup.textContent = "Note deleted!";
        popup.classList.add("show");
        clearTimeout(popupTimeout);
        popupTimeout = setTimeout(() => {
            popup.classList.remove("show");
        }, 2000);
        loadNotesAndTags();
    };
    

    request.onerror = () => {
            error.textContent = "Failed to delete note.";
            error.classList.add("show");
            clearTimeout(errorTimeout);
            errorTimeout = setTimeout(() => {
                error.classList.remove("show");
            }, 3000);
    };
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