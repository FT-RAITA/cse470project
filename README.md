# cse470project

Here's the full workflow for a teammate joining fresh:
1. Clone the repo (not pull — that's for updating a repo you already have; for a brand-new setup you clone):
bash:  git clone https://github.com/FT-RAITA/cse470project.git
  cd cse470project
2. Install dependencies — separately for each folder, since you have a frontend and backend each with their own package.json:
bash:    cd frontend
npm install
cd ../backend
npm install
npm install reads package.json and package-lock.json and pulls in everything listed there — that's why node_modules was in .gitignore and never pushed to GitHub; it's meant to be regenerated locally by each person, not shared through git.
3. Set up the .env file — this is the one thing that's not in the repo at all (correctly, since it has secrets). You'll need to send it to your teammate directly and privately — WhatsApp, Discord DM, whatever — never through GitHub. They create backend/.env themselves and paste in:
database_url = mongodb://...
JWT_SECRET=your_super_secret_key
4. Run both servers (in two separate terminals, since frontend and backend run independently):
bash# Terminal 1
cd backend
npm run dev    # or `node server.js` if you don't have a dev script

# Terminal 2
cd frontend
npm run dev
Going forward, whenever they (or you) come back to work on it:
bashgit pull
And if package.json changed since they last pulled (someone added a new library), they need to re-run npm install in that folder to catch up — git pull alone doesn't install new packages, it just updates the code that lists them.
