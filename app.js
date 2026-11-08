let isSignUpMode = true;
let generatedOTP = "";
let registeredUser = null;
let isGuest = false;

// Habit Counters
let waterCount = 0;
const maxWater = 8;
let pageCount = 0;
const maxPages = 10;
let kmCount = 0.0;
const maxKm = 5.0;
let exerciseCount = 0;
const maxExercise = 60;

let customHabits = [];
let todayGoal = "Drink 8 Glasses of Water!";

// Tasks State & Filter State
let tasks = JSON.parse(localStorage.getItem("focusHubTasks")) || [
    { id: 1, title: "Complete Maths Assignment", completed: true },
    { id: 2, title: "Prepare for Computer Science Quiz", completed: false },
    { id: 3, title: "Practice Web Development", completed: false }
];
let currentTaskFilter = "all"; // 'all', 'completed', 'pending'

document.addEventListener("DOMContentLoaded", () => {
    checkUserSession();
    setupSidebarNavigation();
    updateWaterBar();
    updatePageBar();
    updateKmBar();
    updateExerciseBar();
    renderTasks();
});

// 1. Session & 24-Hour Reset Logic
function checkUserSession() {
    const savedUser = localStorage.getItem("focusHubUser");
    const loginModal = document.getElementById("login-modal");
    const detailsModal = document.getElementById("details-modal");

    if (savedUser) {
        const userData = JSON.parse(savedUser);
        loginModal.style.display = "none";
        detailsModal.style.display = "none";
        
        document.getElementById("welcome2").innerText = `Welcome Back, ${userData.name}!`;
        document.getElementById("welcome3").innerHTML = `<p>Age: ${userData.age} | Height: ${userData.height}cm | Weight: ${userData.weight}kg</p>`;
        
        generateSuggestions(userData.age, userData.weight);
        check24HourReset();
    }
}

function check24HourReset() {
    const lastReset = localStorage.getItem("lastHabitReset");
    const savedGoal = localStorage.getItem("focusHubGoal");
    const now = new Date().getTime();

    if (savedGoal) {
        todayGoal = savedGoal;
        document.getElementById("welcome4").innerText = `Goal: ${todayGoal}`;
    }

    if (!lastReset || (now - parseInt(lastReset)) >= 86400000) {
        waterCount = 0;
        pageCount = 0;
        kmCount = 0.0;
        exerciseCount = 0;
        customHabits.forEach(h => h.current = 0);

        localStorage.setItem("lastHabitReset", now.toString());
        openGoalModal();
    }
}

function openGoalModal() {
    document.getElementById("goal-modal").style.display = "flex";
}

function handleGoalSubmit(event) {
    event.preventDefault();
    const val = document.getElementById("goal-input").value.trim();
    if (val !== "") {
        todayGoal = val;
        localStorage.setItem("focusHubGoal", todayGoal);
        document.getElementById("welcome4").innerText = `Goal: ${todayGoal}`;
    }
    document.getElementById("goal-modal").style.display = "none";
}

// 2. Authentication & Guest Flow
function continueAsGuest() {
    isGuest = true;
    document.getElementById("login-modal").style.display = "none";
    document.getElementById("details-modal").style.display = "flex";
}

function toggleAuthMode(event) {
    event.preventDefault();
    isSignUpMode = !isSignUpMode;

    const title = document.getElementById("auth-title");
    const subtitle = document.getElementById("auth-subtitle");
    const nameInput = document.getElementById("auth-name");
    const btn = document.getElementById("auth-btn");
    const toggleText = document.getElementById("toggle-text");
    const toggleLink = document.getElementById("toggle-link");

    if (isSignUpMode) {
        title.innerText = "Sign Up to Focus Hub";
        subtitle.innerText = "Create an account to track your daily goals.";
        nameInput.style.display = "block";
        nameInput.required = true;
        btn.innerText = "Sign Up & Send Code";
        toggleText.innerText = "Already have an account?";
        toggleLink.innerText = "Log In";
    } else {
        title.innerText = "Log In to Focus Hub";
        subtitle.innerText = "Welcome back! Enter your details.";
        nameInput.style.display = "none";
        nameInput.required = false;
        btn.innerText = "Log In";
        toggleText.innerText = "Don't have an account?";
        toggleLink.innerText = "Sign Up";
    }
}

function handleAuthSubmit(event) {
    event.preventDefault();

    const name = document.getElementById("auth-name").value.trim();
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value.trim();

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!gmailRegex.test(email)) {
        alert("Please enter a valid Gmail address (e.g. user@gmail.com)!");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters long!");
        return;
    }

    if (isSignUpMode) {
        generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
        registeredUser = { name, email, password };

        document.getElementById("login-modal").style.display = "none";
        document.getElementById("user-sent-email").innerText = email;
        document.getElementById("verify-modal").style.display = "flex";

        setTimeout(() => {
            alert(`[SIMULATED GMAIL NOTIFICATION]\n\nHello ${name},\nThank you for signing up on Focus Hub!\nYour 4-digit verification code is: ${generatedOTP}`);
        }, 500);
    } else {
        document.getElementById("login-modal").style.display = "none";
        const userObj = { name: name || "User", age: 20, height: 170, weight: 65 };
        localStorage.setItem("focusHubUser", JSON.stringify(userObj));
        checkUserSession();
    }
}

function handleVerificationSubmit(event) {
    event.preventDefault();
    const enteredOTP = document.getElementById("otp-input").value.trim();

    if (enteredOTP === generatedOTP) {
        document.getElementById("verify-modal").style.display = "none";
        document.getElementById("details-modal").style.display = "flex";
    } else {
        alert("Invalid verification code! Please check the code and try again.");
    }
}

function handleDetailsSubmit(event) {
    event.preventDefault();

    const height = document.getElementById("user-height").value;
    const weight = document.getElementById("user-weight").value;
    const age = document.getElementById("user-age").value;
    const sleep = document.getElementById("user-sleep").value;

    const userName = isGuest ? "Guest User" : (registeredUser ? registeredUser.name : "Buddy");

    const userInfo = { name: userName, height, weight, age, sleep, isGuest };
    localStorage.setItem("focusHubUser", JSON.stringify(userInfo));

    document.getElementById("welcome2").innerText = `Welcome Back, ${userName}!`;
    document.getElementById("welcome3").innerHTML = `<p>Age: ${age} | Height: ${height}cm | Weight: ${weight}kg</p>`;

    generateSuggestions(age, weight);
    document.getElementById("details-modal").style.display = "none";
    openGoalModal();
}

function signOutUser() {
    localStorage.removeItem("focusHubUser");
    localStorage.removeItem("focusHubGoal");
    localStorage.removeItem("focusHubTasks");
    location.reload();
}

// 3. Habit Image Mapping & Suggestions
function getHabitImage(name) {
    const lower = name.toLowerCase();
    if (lower.includes('water') || lower.includes('drink')) {
        return 'https://img.magnific.com/free-vector/water-glass-cartoon-vector-icon-illustration-drink-object-icon-isolated-flat-vector_138676-13612.jpg';
    } else if (lower.includes('read') || lower.includes('book')) {
        return 'https://img.magnific.com/free-vector/book-floating-cartoon-vector-icon-illustration-education-object-icon-isolated-flat-vector_138676-13661.jpg';
    } else if (lower.includes('walk') || lower.includes('step') || lower.includes('run')) {
        return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaNoZ5ujTbpr6_EHxTK2-FUrCzq-GyPw7A6L3BJeMPaA&s=10';
    } else if (lower.includes('exercise') || lower.includes('workout') || lower.includes('gym')) {
        return 'https://cdn-icons-png.flaticon.com/512/755/755258.png';
    } else {
        return 'https://cdn-icons-png.flaticon.com/512/755/755258.png';
    }
}

function generateSuggestions(age, weight) {
    const pillContainer = document.getElementById("suggested-pills");
    if (!pillContainer) return;
    
    pillContainer.innerHTML = "";
    let suggestions = ["Morning Stretching", "Read Book 10 Mins", "Evening Walk", "Workout 30 Mins"];

    suggestions.forEach(text => {
        const span = document.createElement("span");
        span.innerText = `+ ${text}`;
        span.style.cssText = `
            background: #27272a;
            color: #f59e0b;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 12px;
            cursor: pointer;
            border: 1px solid #3f3f46;
        `;
        span.onclick = () => addCustomHabit(text);
        pillContainer.appendChild(span);
    });
}

function addCustomHabit(presetText) {
    const input = document.getElementById("custom-habit-name");
    const habitName = presetText || input.value.trim();

    if (!habitName) return;

    const habitObj = {
        id: Date.now(),
        name: habitName,
        current: 0,
        max: 5,
        image: getHabitImage(habitName)
    };
    customHabits.push(habitObj);

    renderCustomHabits();
    if (!presetText) input.value = "";
}

function renderCustomHabits() {
    const container = document.getElementById("custom-habits-container");
    container.innerHTML = "";

    customHabits.forEach(habit => {
        const percentage = (habit.current / habit.max) * 100;

        const card = document.createElement("div");
        card.className = "interactive-card";
        card.onclick = () => incrementCustomHabit(habit.id);

        card.innerHTML = `
            <div style="background-image: url('${habit.image}'); background-size: cover; background-position: center; height: 44px; width: 44px; position: absolute; top: 18px; left: 20px; border-radius: 12px; background-color: #27272a;"></div>
            <div class="card-info">
                <div style="font-size: 15px; font-weight: 600; color: #fafafa;">${habit.name}</div>
                <div id="habit-status-${habit.id}" style="font-size: 13px; font-weight: 500; color: #10b981;">${habit.current} / ${habit.max} Done</div>
            </div>
            <div class="progress-track">
                <div id="habit-bar-${habit.id}" style="height: 100%; width: ${percentage}%; background-color: #f59e0b; border-radius: 10px; transition: width 0.3s ease;"></div>
            </div>
        `;

        container.appendChild(card);
    });
}

function incrementCustomHabit(id) {
    customHabits = customHabits.map(h => {
        if (h.id === id && h.current < h.max) {
            h.current++;
            document.getElementById(`habit-status-${id}`).innerText = `${h.current} / ${h.max} Done`;
            const percentage = (h.current / h.max) * 100;
            document.getElementById(`habit-bar-${id}`).style.width = `${percentage}%`;

            if (h.current === h.max) {
                document.getElementById(`habit-status-${id}`).innerText = "Completed! 🎉";
            }
        }
        return h;
    });
}

// 4. Default Habit Trackers
function addWater() {
    if (waterCount < maxWater) {
        waterCount++;
        document.getElementById("water-count").innerText = waterCount;
        updateWaterBar();
        if (waterCount === maxWater) document.getElementById("glass").innerHTML = "Completed! (8/8)";
    }
}

function updateWaterBar() {
    const percentage = (waterCount / maxWater) * 100;
    const bar = document.getElementById("bar2");
    if (bar) bar.style.width = `${percentage}%`;
}

function addPage() {
    if (pageCount < maxPages) {
        pageCount++;
        document.getElementById("page-count").innerText = pageCount;
        updatePageBar();
        if (pageCount === maxPages) document.getElementById("page").innerHTML = "Completed! (10/10)";
    }
}

function updatePageBar() {
    const percentage = (pageCount / maxPages) * 100;
    const bar = document.getElementById("bar6");
    if (bar) bar.style.width = `${percentage}%`;
}

function addKm() {
    if (kmCount < maxKm) {
        kmCount = parseFloat((kmCount + 0.5).toFixed(1));
        document.getElementById("km-count").innerText = kmCount;
        updateKmBar();
        if (kmCount >= maxKm) document.getElementById("step").innerHTML = "Completed! (5.0 km)";
    }
}

function updateKmBar() {
    const percentage = (kmCount / maxKm) * 100;
    const bar = document.getElementById("bar8");
    if (bar) bar.style.width = `${percentage}%`;
}

function addExercise() {
    if (exerciseCount < maxExercise) {
        exerciseCount += 10;
        if (exerciseCount > maxExercise) exerciseCount = maxExercise;
        document.getElementById("exercise-count").innerText = exerciseCount;
        updateExerciseBar();

        if (exerciseCount === maxExercise) {
            document.getElementById("exercise-status").innerHTML = "Completed! 🎉 (60 mins)";
        }
    }
}

function updateExerciseBar() {
    const percentage = (exerciseCount / maxExercise) * 100;
    const bar = document.getElementById("bar10");
    if (bar) bar.style.width = `${percentage}%`;
}

// 5. Priority Tasks Manager (With Add, Edit, Delete, Filter, Counts & LocalStorage)
function saveTasksToStorage() {
    localStorage.setItem("focusHubTasks", JSON.stringify(tasks));
}

function renderTasks() {
    const container = document.getElementById("task-list-container");
    if (!container) return;
    container.innerHTML = "";

    // Task counts calculation
    const totalCount = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const pendingCount = totalCount - completedCount;

    // Render Filter Buttons & Counts Header inside container if not already present
    let headerEl = document.getElementById("task-header-stats");
    if (!headerEl) {
        headerEl = document.createElement("div");
        headerEl.id = "task-header-stats";
        headerEl.style.cssText = "margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;";
        container.parentNode.insertBefore(headerEl, container);
    }

    headerEl.innerHTML = `
        <div style="font-size: 13px; color: #a1a1aa;">
            Total: <b>${totalCount}</b> | Completed: <b style="color: #10b981;">${completedCount}</b> | Pending: <b style="color: #f59e0b;">${pendingCount}</b>
        </div>
        <div style="display: flex; gap: 6px;">
            <button onclick="setTaskFilter('all')" style="padding: 4px 10px; font-size: 11px; background: ${currentTaskFilter === 'all' ? '#f59e0b' : '#27272a'}; color: ${currentTaskFilter === 'all' ? '#09090b' : '#fafafa'}; border: none; border-radius: 4px; cursor: pointer;">All</button>
            <button onclick="setTaskFilter('completed')" style="padding: 4px 10px; font-size: 11px; background: ${currentTaskFilter === 'completed' ? '#f59e0b' : '#27272a'}; color: ${currentTaskFilter === 'completed' ? '#09090b' : '#fafafa'}; border: none; border-radius: 4px; cursor: pointer;">Completed</button>
            <button onclick="setTaskFilter('pending')" style="padding: 4px 10px; font-size: 11px; background: ${currentTaskFilter === 'pending' ? '#f59e0b' : '#27272a'}; color: ${currentTaskFilter === 'pending' ? '#09090b' : '#fafafa'}; border: none; border-radius: 4px; cursor: pointer;">Pending</button>
        </div>
    `;

    // Filter tasks based on current filter selection
    const filteredTasks = tasks.filter(task => {
        if (currentTaskFilter === 'completed') return task.completed;
        if (currentTaskFilter === 'pending') return !task.completed;
        return true;
    });

    if (filteredTasks.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: #a1a1aa; padding: 15px; font-size: 13px;">No tasks found.</div>`;
        return;
    }

    filteredTasks.forEach(task => {
        const taskDiv = document.createElement("div");
        taskDiv.style.cssText = `
            background-color: #18181b;
            border: 1px solid #27272a;
            border-radius: 12px;
            padding: 14px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;

        const title = document.createElement("span");
        title.innerText = task.title;
        title.style.cssText = `
            font-size: 15px;
            font-weight: 500;
            color: ${task.completed ? '#a1a1aa' : '#fafafa'};
            text-decoration: ${task.completed ? 'line-through' : 'none'};
            flex: 1;
            margin-right: 10px;
        `;

        const btnGroup = document.createElement("div");
        btnGroup.style.cssText = "display: flex; gap: 8px;";

        // Complete / In Progress Toggle Button
        const toggleBtn = document.createElement("button");
        toggleBtn.innerText = task.completed ? "Done" : "Pending";
        toggleBtn.style.cssText = `
            padding: 6px 12px;
            background-color: ${task.completed ? '#10b981' : '#f59e0b'};
            color: #09090b;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        `;
        toggleBtn.onclick = () => toggleTask(task.id);

        // Edit Task Button
        const editBtn = document.createElement("button");
        editBtn.innerText = "Edit";
        editBtn.style.cssText = `
            padding: 6px 10px;
            background-color: #27272a;
            color: #fafafa;
            border: 1px solid #3f3f46;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
        `;
        editBtn.onclick = () => editTask(task.id);

        // Delete Task Button
        const deleteBtn = document.createElement("button");
        deleteBtn.innerText = "Delete";
        deleteBtn.style.cssText = `
            padding: 6px 10px;
            background-color: #ef4444;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
        `;
        deleteBtn.onclick = () => deleteTask(task.id);

        btnGroup.appendChild(toggleBtn);
        btnGroup.appendChild(editBtn);
        btnGroup.appendChild(deleteBtn);

        taskDiv.appendChild(title);
        taskDiv.appendChild(btnGroup);
        container.appendChild(taskDiv);
    });
}

function addNewTask() {
    const input = document.getElementById("new-task-input");
    const taskTitle = input.value.trim();

    if (taskTitle === "") {
        alert("Please enter a task name!");
        return;
    }

    tasks.push({ id: Date.now(), title: taskTitle, completed: false });
    input.value = "";
    saveTasksToStorage();
    renderTasks();
}

function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) return { ...task, completed: !task.completed };
        return task;
    });
    saveTasksToStorage();
    renderTasks();
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newTitle = prompt("Edit your task:", task.title);
    if (newTitle !== null && newTitle.trim() !== "") {
        task.title = newTitle.trim();
        saveTasksToStorage();
        renderTasks();
    }
}

function deleteTask(id) {
    if (confirm("Are you sure you want to delete this task?")) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasksToStorage();
        renderTasks();
    }
}

function setTaskFilter(filter) {
    currentTaskFilter = filter;
    renderTasks();
}

// 6. Sidebar Navigation
function setupSidebarNavigation() {
    const links = document.querySelectorAll(".nav-link");
    links.forEach(link => {
        link.addEventListener("click", () => {
            links.forEach(l => l.classList.remove("active"));
            link.classList.add("active");
        });
    });
}