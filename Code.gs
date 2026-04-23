var ROOT_FOLDER_NAME = 'PHOTOINDEX_MAPA';

function doGet(e) {
  try {
    var path = (e.pathInfo || '').replace(/^\//, '');
    path = decodeURIComponent(path);
    
    if (path == '' || path == '') {
      return serveFile('index.html', 'text/html');
    }
    
    if (path.endsWith('.html')) {
      return serveFile(path, 'text/html');
    }
    if (path.endsWith('.css')) {
      return serveFile(path, 'text/css');
    }
    if (path.endsWith('.js')) {
      return serveFile(path, 'application/javascript');
    }
    if (path.endsWith('.json')) {
      return serveFile(path, 'application/json');
    }
    
    // Servir imágenes
    return serveImage(path);
  } catch(error) {
    return ContentService.createTextOutput('Error: ' + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function serveFile(filename, mimeType) {
  var folder = getRootFolder();
  var file = findFile(folder, filename);
  
  if (!file) {
    return ContentService.createTextOutput('File not found: ' + filename);
  }
  
  var content = file.getBlob().getDataAsString();
  
  if (mimeType == 'text/html') {
    return HtmlService.createHtmlOutput(content)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  return ContentService.createTextOutput(content)
    .setMimeType(mimeType);
}

function serveImage(path) {
  var folder = getRootFolder();
  var imagesFolder = null;
  
  try {
    var imageFolders = folder.getFoldersByName('images');
    if (imageFolders.hasNext()) {
      imagesFolder = imageFolders.next();
    }
  } catch(e) {
    return ContentService.createTextOutput('Images folder not found');
  }
  
  if (!imagesFolder) {
    return ContentService.createTextOutput('Images folder not accessible');
  }
  
  // Obtener nombre de archivo sin "images/" del inicio
  var filename = path.replace(/^images\//i, '');
  
  // Intentar encontrar el archivo con diferentes variantes
  var file = findFile(imagesFolder, filename);
  
  if (!file) {
    // Intentar con extensión .tif si es .png
    if (filename.endsWith('.png')) {
      file = findFile(imagesFolder, filename.replace(/\.png$/i, '.tif'));
    }
  }
  
  if (!file) {
    // Intentar con espacios en lugar de guiones bajos
    file = findFile(imagesFolder, filename.replace(/_/g, ' '));
  }
  
  if (!file) {
    return ContentService.createTextOutput('Image not found: ' + filename);
  }
  
  var blob = file.getBlob();
  return ContentService.createBinaryOutput(blob.getBytes())
    .setMimeType(blob.getContentType());
}

function findFile(folder, filename) {
  try {
    var files = folder.getFilesByName(filename);
    if (files.hasNext()) {
      return files.next();
    }
  } catch(e) {
    Logger.log('Error finding file: ' + e);
  }
  return null;
}

function getRootFolder() {
  try {
    var folders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
    if (folders.hasNext()) {
      return folders.next();
    } else {
      throw new Error('Folder "' + ROOT_FOLDER_NAME + '" not found');
    }
  } catch(error) {
    Logger.log('Error getting root folder: ' + error);
    throw error;
  }
}
