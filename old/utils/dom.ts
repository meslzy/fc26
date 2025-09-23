interface ElementWithRootElement {
	getRootElement(): Element;
}

type ElementLike = Element | ElementWithRootElement;

export function getRealElement(elem: ElementLike): Element {
	if ('getRootElement' in elem && typeof elem.getRootElement === 'function') {
		return elem.getRootElement();
	}
	return elem as Element;
}

export function select<T extends Element = Element>(
	query: string,
	parent: ParentNode = document
): T | null {
	if (!query) return null;
	return getRealElement(parent as ElementLike).querySelector<T>(query);
}

export function insertBefore<T extends Node>(
	newNode: T | ElementLike,
	existingNode: Node | ElementLike
): T | null {
	if (!newNode || !existingNode) return null;

	const realExistingNode = getRealElement(existingNode as ElementLike);
	const realNewNode = getRealElement(newNode as ElementLike);

	if (!realExistingNode.parentNode) return null;

	realExistingNode.parentNode.insertBefore(realNewNode, realExistingNode);
	return newNode as T;
}

export function insertAfter<T extends Node>(
	newNode: T | ElementLike,
	existingNode: Node | ElementLike
): T | null {
	if (!newNode || !existingNode) return null;

	const realExistingNode = getRealElement(existingNode as ElementLike);
	const realNewNode = getRealElement(newNode as ElementLike);

	if (!realExistingNode.parentNode) return null;

	realExistingNode.parentNode.insertBefore(
		realNewNode,
		realExistingNode.nextSibling
	);
	return newNode as T;
}
