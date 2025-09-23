export function getRealElement(elem: any) {
	if (elem.getRootElement) {
		return elem.getRootElement();
	}
	return elem;
}

export function select(query: string, parent: any = document) {
	if (!query) return;
	return getRealElement(parent).querySelector(query);
}

export function insertBefore(newNode: any, existingNode: any) {
	if (!newNode) return;
	if (!existingNode) return;

	existingNode = getRealElement(existingNode);
	existingNode.parentNode.insertBefore(getRealElement(newNode), existingNode);

	return newNode;
}

export function insertAfter(newNode: any, existingNode: any) {
	if (!newNode) return;
	if (!existingNode) return;

	existingNode = getRealElement(existingNode);
	existingNode.parentNode.insertBefore(
		getRealElement(newNode),
		existingNode.nextSibling,
	);

	return newNode;
}
