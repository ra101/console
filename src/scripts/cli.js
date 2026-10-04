/* global $, localStorage, Shell */
let ipAddr = "127.0.0.1"
$(function () {
  $.getJSON("https://api.ipify.org?format=jsonp&callback=?",
    function (json) {
      ipAddr = json.ip;
      rootPath = 'ra101/users/' + ipAddr;
    }
  );
});

const errors = {
  invalidDirectory: 'Error: not a valid directory',
  noWriteAccess: 'Error: you do not have write access to this directory',
  fileNotFound: 'Error: file not found in current directory',
  fileNotSpecified: 'Error: you did not specify a file',
  invalidFile: 'Error: not a valid file',
};

const struct = {
  root: ['about', 'resume', 'contact'],
  skills: ['languages', 'frameworks', 'databases', 'tools'],
};

const commands = {};
let systemData = {};
const title = ["🖥️ https://ra101.dev/console/", "🖥️ ra101://console"];
let rootPath = 'ra101/users/127.0.0.1';

const getDirectory = () => localStorage.directory;
const setDirectory = (dir) => {
  localStorage.directory = dir;
};

function close_terminal() {
  $('#terminal').toggleClass('closing');
  $('#terminal').html(`
    <span class="bye">
    <span class="pink-glow">(◕︵◕)/</span>
    <span class="ping">CONNECTING TO https://ra101.dev/</span>
    </span>
    <script>
    let timeUntillPing = 701
    let pingElement = $(".ping")[0]
    let pingElementValue = pingElement.innerText
    const intervalObject = setInterval(()=>{
      if (timeUntillPing <= 0){
        clearInterval(intervalObject)
        window.close()
        window.open("https://ra101.github.io/", target="_self")
      }
      else {
        timeUntillPing -= 1;
        pingElement.innerText = pingElementValue + " ...IN " + timeUntillPing.toString().padStart(3, '0') + "ms"
      }
    }, 1);
    </script>
  `)
}
// noWriteAccess commands.
commands.mkdir = () => errors.noWriteAccess;
commands.touch = () => errors.noWriteAccess;
commands.rm = () => errors.noWriteAccess;
commands.rmdir = () => errors.noWriteAccess;
commands.cp = () => errors.noWriteAccess;
commands.mv = () => errors.noWriteAccess;
commands.chmod = () => errors.noWriteAccess;
commands.chown = () => errors.noWriteAccess;

commands.ls = (directory) => {
  if (directory === '..' || directory === '~') {
    return systemData['root'];
  }

  if (directory in struct) {
    return systemData[directory];
  }

  return systemData[getDirectory()];
};

commands.dir = commands.ls

// Completion data for the terminal's Tab key.
commands.__getFiles = () => {
  const directory = getDirectory();
  const entries = directory === 'root'
    ? [...struct.root, ...Object.keys(struct).filter((entry) => entry !== 'root')]
    : struct[directory] || struct.root;
  return entries.map((entry) => (entry in struct ? `${entry}/` : `${entry}.txt`));
};

commands.__getFilesIn = (directory) => {
  const lookupDirectory = directory && directory in struct ? directory : getDirectory();
  const entries = lookupDirectory === 'root'
    ? [...struct.root, ...Object.keys(struct).filter((entry) => entry !== 'root')]
    : struct[lookupDirectory] || struct.root;
  return entries.map((entry) => (entry in struct ? `${entry}/` : `${entry}.txt`));
};

// View list of possible commands.
commands.help = () => systemData.help;
commands.all_commands = () => systemData.all_commands;

// A simple Echo.
commands.printf = commands.echo = (sampleText) => { return sampleText };


// Few additionals.
commands.hostname = () => { return ipAddr };
commands.uname = () => {
  if (navigator.userAgent.indexOf("Chrome") > -1) {
    return "V8"
  } else if (navigator.userAgent.indexOf("WebKit") > -1) {
    return "JavaScriptCore"
  } else {
    return "SpiderMonkey"
  }
}

// Glowing 〈 RA 〉 text
commands.ra = () => systemData.ra;
commands.ra101 = commands.ra

// a lil codebytere tribute
commands.codebytere = () => systemData.codebytere;

// Display current path.
commands.pwd = () => {
  const dir = getDirectory();
  return dir === 'root' ? rootPath : `${rootPath}/${dir}`;
};

// See command history.
commands.history = () => {
  let history = localStorage.history;
  history = history ? Object.values(JSON.parse(history)) : [];
  return `<p>${history.join('<br>')}</p>`;
};

// Move into specified directory.
commands.cd = (newDirectory) => {
  const currDir = getDirectory();
  const dirs = Object.keys(struct);
  const newDir = newDirectory ? newDirectory.trim() : '';

  if (dirs.includes(newDir) && currDir !== newDir) {
    setDirectory(newDir);
  } else if (newDir === '' || newDir === '~' || (newDir === '..' && dirs.includes(currDir))) {
    setDirectory('root');
  } else {
    return errors.invalidDirectory;
  }
  return null;
};

// Display contents of specified file.
commands.cat = (filename) => {
  if (!filename) return errors.fileNotSpecified;

  const isADirectory = (filename) => struct.hasOwnProperty(filename);
  const hasValidFileExtension = (filename, extension) => filename.includes(extension);
  const isFileInDirectory = (filename) => (filename.split('/').length === 1 ? false : true);
  const isFileInSubdirectory = (filename, directory) => struct[directory].includes(filename);

  if (isADirectory(filename)) return errors.invalidFile;

  if (!isFileInDirectory(filename)) {
    const fileKey = filename.split('.')[0];
    const isValidFile = (filename) => systemData.hasOwnProperty(filename);

    if (isValidFile(fileKey) && hasValidFileExtension(filename, '.txt')) {
      return systemData[fileKey];
    }
  }

  if (isFileInDirectory(filename)) {
    if (hasValidFileExtension(filename, '.txt')) {
      const directories = filename.split('/');
      const directory = directories.slice(0, 1).join(',');
      const fileKey = directories.slice(1, directories.length).join(',').split('.')[0];
      if (directory === 'root' || !struct.hasOwnProperty(directory))
        return errors.noSuchFileOrDirectory;

      return isFileInSubdirectory(fileKey, directory)
        ? systemData[fileKey]
        : errors.noSuchFileOrDirectory;
    }

    return errors.noSuchFileOrDirectory;
  }

  return errors.fileNotFound;
};

//source code
commands.source_code = () => { window.open("https://github.com/ra101/console", "_blank"); }

//shutdown command
commands.quit = commands.shutdown = commands.exit = close_terminal;

//restart command
commands.reboot = commands.restart = commands.reload = () => { location.reload(); }


// Initialize cli.
$(() => {
  const cmd = document.getElementById('terminal');

  $.ajaxSetup({ cache: false });
  const pages = [];
  pages.push($.get('src/pages/about.html'));
  pages.push($.get('src/pages/contact.html'));
  pages.push($.get('src/pages/help.html'));
  pages.push($.get('src/pages/all_commands.html'));
  pages.push($.get('src/pages/ra.html'));
  pages.push($.get('src/pages/codebytere.html'));
  pages.push($.get('src/pages/resume.html'));
  pages.push($.get('src/pages/root.html'));
  pages.push($.get('src/pages/skills.html'));
  pages.push($.get('src/pages/languages.html'));
  pages.push($.get('src/pages/frameworks.html'));
  pages.push($.get('src/pages/databases.html'));
  pages.push($.get('src/pages/tools.html'));
  $.when
    .apply($, pages)
    .done(
      (
        aboutData,
        contactData,
        helpData,
        all_commandsData,
        raData,
        codebytereData,
        resumeData,
        rootData,
        skillsData,
        languagesData,
        frameworksData,
        databasesData,
        toolsData,
      ) => {
        systemData['about'] = aboutData[0];
        systemData['contact'] = contactData[0];
        systemData['help'] = helpData[0];
        systemData['all_commands'] = all_commandsData[0]
        systemData['ra'] = raData[0];
        systemData['codebytere'] = codebytereData[0];
        systemData['resume'] = resumeData[0];
        systemData['root'] = rootData[0];
        systemData['skills'] = skillsData[0];
        systemData['languages'] = languagesData[0];
        systemData['frameworks'] = frameworksData[0];
        systemData['databases'] = databasesData[0];
        systemData['tools'] = toolsData[0];
      },
    );

  const terminal = new Shell(cmd, commands);
});
