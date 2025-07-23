const usernameInput = document.getElementById('usernameInput');
const searchButton = document.getElementById('searchButton');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const userDetailsDiv = document.getElementById('userDetails');
const userReposDiv = document.getElementById('userRepos'); // New element

searchButton.addEventListener('click', fetchUserDetailsAndRepos);
usernameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        fetchUserDetailsAndRepos();
    }
});

async function fetchUserDetailsAndRepos() {
    const username = usernameInput.value.trim();
    if (!username) {
        displayError('Please enter a GitHub username.');
        return;
    }

    // Clear previous results and errors
    hideAll();
    loadingDiv.classList.remove('hidden');

    try {
        // Fetch user details
        const userResponse = await fetch(`https://api.github.com/users/${username}`);
        const userData = await userResponse.json();

        if (userResponse.ok) {
            displayUserDetails(userData);

            // Fetch user repositories
            const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`); // Fetch up to 100 repos, sorted by last update
            const reposData = await reposResponse.json();

            if (reposResponse.ok) {
                displayUserRepos(reposData, username);
            } else {
                displayError(`Error fetching repositories: ${reposData.message || 'Unknown error'}`);
            }

        } else {
            if (userResponse.status === 404) {
                displayError(`User "${username}" not found.`);
            } else if (userResponse.status === 403) {
                const rateLimitReset = userResponse.headers.get('X-RateLimit-Reset');
                const resetTime = new Date(rateLimitReset * 1000); // Convert to milliseconds
                displayError(`Rate limit exceeded for user details. Please try again after ${resetTime.toLocaleTimeString()}.`);
            } else {
                displayError(`Error fetching user data: ${userData.message || 'Unknown error'}`);
            }
        }
    } catch (error) {
        console.error('Network or parsing error:', error);
        displayError('An unexpected error occurred. Please check your internet connection.');
    } finally {
        loadingDiv.classList.add('hidden');
    }
}

function displayUserDetails(user) {
    userDetailsDiv.innerHTML = `
        <img src="${user.avatar_url}" alt="${user.login}'s avatar">
        <h2>${user.name || user.login}</h2>
        <p><strong>Username:</strong> ${user.login}</p>
        ${user.bio ? `<p><strong>Bio:</strong> ${user.bio}</p>` : ''}
        ${user.company ? `<p><strong>Company:</strong> ${user.company}</p>` : ''}
        ${user.location ? `<p><strong>Location:</strong> ${user.location}</p>` : ''}
        <p><strong>Public Repos:</strong> ${user.public_repos}</p>
        <p><strong>Followers:</strong> ${user.followers}</p>
        <p><strong>Following:</strong> ${user.following}</p>
        <p><strong>Joined GitHub:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
        <p><a href="${user.html_url}" target="_blank">View GitHub Profile</a></p>
    `;
    userDetailsDiv.classList.remove('hidden');
}

async function displayUserRepos(repos, username) {
    if (repos.length === 0) {
        userReposDiv.innerHTML = '<h2>Public Repositories</h2><p>No public repositories found for this user.</p>';
        userReposDiv.classList.remove('hidden');
        return;
    }

    let reposHtml = '<h2>Public Repositories</h2>';
    for (const repo of repos) {
        // Option 1: Use the primary language directly from the repo object (simpler, fewer API calls)
        const primaryLanguage = repo.language ? `<p><strong>Primary Language:</strong> ${repo.language}</p>` : '';

        // Option 2 (More advanced, uncomment if you want a detailed breakdown):
        // const languages = await fetchRepoLanguages(username, repo.name);
        // let languageTags = '';
        // if (languages) {
        //     for (const lang in languages) {
        //         languageTags += `<span>${lang}</span>`;
        //     }
        // }
        // const detailedLanguages = languageTags ? `<div class="repo-languages">${languageTags}</div>` : '';


        reposHtml += `
            <div class="repo-card">
                <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
                ${repo.description ? `<p>${repo.description}</p>` : ''}
                ${primaryLanguage}
                <p><strong>Stars:</strong> ${repo.stargazers_count}</p>
                <p><strong>Forks:</strong> ${repo.forks_count}</p>
                <div class="repo-links">
                    <a href="${repo.html_url}" target="_blank">Repo Link</a>
                    ${repo.homepage ? `<a href="${repo.homepage}" target="_blank">Live Demo</a>` : ''}
                </div>
                ${ /* Uncomment the line below if using Option 2 for detailed languages */ '' /* detailedLanguages */ }
            </div>
        `;
    }
    userReposDiv.innerHTML = reposHtml;
    userReposDiv.classList.remove('hidden');
}

// Option 2: Function to fetch detailed languages for a specific repo (handle with care due to rate limits)
// async function fetchRepoLanguages(owner, repoName) {
//     try {
//         const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}/languages`);
//         if (response.ok) {
//             return await response.json();
//         } else {
//             console.error(`Error fetching languages for ${repoName}: ${response.status}`);
//             return null;
//         }
//     } catch (error) {
//         console.error(`Network error fetching languages for ${repoName}:`, error);
//         return null;
//     }
// }


function displayError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideAll() {
    loadingDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    userDetailsDiv.classList.add('hidden');
    userDetailsDiv.innerHTML = '';
    userReposDiv.classList.add('hidden'); // Hide repos section
    userReposDiv.innerHTML = ''; // Clear previous repo content
}

document.getElementById('toggleMode').addEventListener('click', function () {
  document.body.classList.toggle('dark-mode');
});
