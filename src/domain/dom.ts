export function getRealElement(elem) {
  if (elem.getRootElement) {
    return elem.getRootElement();
  }

  return elem;
}

export function select(query, parent = document) {
  if (!query) return;

  return getRealElement(parent).querySelector(query);
}

export function insertBefore(newNode, existingNode) {
  if (!newNode) return;
  if (!existingNode) return;

  existingNode = getRealElement(existingNode);

  existingNode.parentNode.insertBefore(getRealElement(newNode), existingNode);

  return newNode;
}

export function insertAfter(newNode, existingNode) {
  if (!newNode) return;
  if (!existingNode) return;

  existingNode = getRealElement(existingNode);

  existingNode.parentNode.insertBefore(getRealElement(newNode), existingNode.nextSibling);

  return newNode;
}
