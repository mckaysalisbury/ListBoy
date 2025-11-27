
interface IRenderSelf {
    Render(mappers: Mappers): HTMLElement;
}

function isIRenderSelf(item: any) : item is IRenderSelf {
    return 'Render' in item; // I could also check if it's a function or something, maybe later.
}

function isString(data: any): boolean {
    return data.constructor === String;
}

type Mappers = {
    object: (input: object) => object,
    string: (input: string) => string | null,
}

const identity: Mappers = {
    object: (input: object) => input,
    string: (input: string) => input,
}

function normalize(mappers?: Partial<Mappers>): Mappers {
    return { ...identity, ...mappers };
}

/** These are the CSS classes that ListBoy emits and recommends get styled by the caller */
enum CSSClasses {
    /** A div rendered from an array */
    Array = "array",
    /** A div rendered from a raw JSON object */
    Dictionary = "dictionary",
    /** A div for a Dictionary Entry that is just `string: string` */
    SimpleDictionaryEntry = "simple-dictionary-entry",
    /** A div for a Dicionary Entry that is more complex than `string: string` */
    ComplexDictionaryEntry = "complex-dictionary-entry",
    /** A default span for a raw string */
    StringDefault = "string-default",
    /** A default span for the key of a dictionary, i.e. a name of a JSON member, with a string value */
    SimpleKeyDefault = "simple-key-default",
    /** An empty span between a simple key and a string value*/
    SimpleSeparator = "simple-separator",
    /** A default span for the key of a dictionary, i.e. a name of a JSON member, with a complex value */
    ComplexKeyDefault = "complex-key-default",
    /** A div which always contains the header of a complex entry */
    ComplexEntryHeader = "complex-entry-header",
    /** A div which always contains the body of a complex entry */
    ComplexEntryBody = "complex-entry-body",
    /** A div which always contains the header of a null-valued entry */
    NullDictionaryEntry = "null-dictionary-entry",
    /** A default span for the key of a dictionary, i.e. a name of a JSON member, with a complex value */
    NullKeyDefault = "null-key-default",
    /** A span which is a placeholder for a null value */
    NullValue = "null-value",
}

enum MarkdownFormatting {
    Emphasis = "em",
    Strong = "strong",
}

/**
 * The class that knows how to render data objects
 * Usage:
 * ListBoy.RenderTo({}, "main");
 */
class ListBoy {
    /**
     * A variable (that is overridable in case you really need this text as a key) which is used to
     * add the specified class to the object.
     */
    static classListAdd = "target.classList.add";
    static setId = "target.id";

    // private static fixMappers(){}

    /**
     * Renders the data object into the target DOM object (when it's ready to do so)
     * @param dataObject The data to render
     * @param targetId The ID of the DOM object to render it into
     * @param mappers mapping functions that will be called on appropriate objects in the tree (default is the identity function)
     */
    static RenderTo(dataObject: any, targetId: string, mappers?: Partial<Mappers>): void {
        const cleanMappers = normalize(mappers)

        const ready = () => this.ReadyToRenderTo(dataObject, targetId, cleanMappers);

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", ready);
        } else {
            ready();
        }
    }

    /**
     * Renders the data object into the target DOM object (presuming it's ready to do so)
     * Precondition: The document is ready to get the document elements
     * @param dataObject The data to render
     * @param targetId The ID of the DOM object to render it into
     * @param objectMapper A mapping function that will be called on all (JSON) objects in the tree
     */
    static ReadyToRenderTo(dataObject: any, targetId: string, mappers: Mappers) {
        try {
            let target = document.getElementById(targetId);
            if (target === null) {
                throw new Error("ListBoy couldn't find your target: " + targetId);
            }
            target.appendChild(this.CreateItem(dataObject, mappers));
        } catch (ex) {
            alert(ex);
        }
    }

    /**
     * Builds a single item (not recommended for external use)
     * @param item The item to build
     * @param objectMapper A mapping function that will be called on all (JSON) objects in the tree (default is the identity function)
     */
    static CreateItem(item: any, mappers: Mappers): HTMLElement | Text {
        if (item === null) {
            return this.CreateNull();
        } else if (item.constructor == Object) {  // JSON
            return this.CreateData(mappers.object(item), mappers);
        } else if (typeof(item) == "number") {
            return document.createTextNode(item.toString());
        } else if (typeof(item) == "string") {
            return this.CreateText(mappers.string(item), CSSClasses.StringDefault);
        } else if (Array.isArray(item)) {
            return this.CreateArray(item, mappers);
        } else if (typeof(item) === "object") {
            if (isIRenderSelf(item)) {
                return item.Render(mappers);
            } else if (item.tagName === "SPAN") {
                return item;
            } else {
                throw new Error(`Don't know how to build an object with tag: ${item.tagName}`);
            }
        } else {
            throw new Error(`Don't know how to build a ${typeof item}`);
        }
    }

    private static MarkdownTag(content: string, format: MarkdownFormatting) : HTMLElement | Text {
        let element = document.createElement(format);
        element.innerHTML = content;
        return element;
    }

    /**
     * Creates a text Node, potentially inside a span (dealing with pseudo markdown)
     * @param item The string for the span
     * @param defaultClass The class to use (if it isn't markdown)
     */
    private static CreateText(item: string, defaultClass = null) : HTMLElement | Text {
        if (item[0] === "`") {  // This is the indicator for markdown mode
            let pieces = item.substring(1).split("*");
            let format : MarkdownFormatting = null; // presume no formatting
            let displayedFormat = format;
            let container = document.createElement("span");
            for (let piece of pieces) {
                if (piece !== "") {
                    container.appendChild(this.MarkdownTag(piece, format));
                    displayedFormat = format;
                }
                // adjust language state
                if (format === null) { // First star always puts us into italics
                    format = MarkdownFormatting.Emphasis;
                } else {
                    if (piece === "") { // This means two consecutive stars
                        // This can't nest ** and *
                        if (format === MarkdownFormatting.Emphasis) {
                            // We need to know what we last printed
                            if (displayedFormat === MarkdownFormatting.Strong) {
                                format = null;
                            } else {
                                format = MarkdownFormatting.Strong;
                            }
                        } else {
                            format = MarkdownFormatting.Emphasis;
                        }
                    } else {
                        if (format === MarkdownFormatting.Emphasis) {
                            format = null;
                        } else {
                            format = MarkdownFormatting.Emphasis;
                        }
                    }
                }
            }
            return container;
        } else {
            let element = document.createElement("span");
            element.className = defaultClass;

            element.innerHTML = item;
            return element
        }
    }

    /**
     * Creates a null value
     */
    private static CreateNull(): HTMLElement {
        let container = document.createElement('span');
        container.className = CSSClasses.NullValue;
        return container;
    }

    /**
     * Creates data from an array
     * @param data The array data
     */
    private static CreateArray(data: Array<any>, mappers: Mappers): HTMLDivElement {
        let container = document.createElement("div");
        container.className = CSSClasses.Array;
        for(let item of data) {
            if (typeof(item) === "function") {
                item(container);
            }
            else {
                container.appendChild(this.CreateItem(item, mappers));
            }
        }
        return container;
    }

    /** Builds as if from a dictionary */
    private static CreateData(data: Object, mappers: Mappers) : HTMLDivElement {
        let container = document.createElement("div");
        container.className = CSSClasses.Dictionary;

        for(let [key, value] of Object.entries(data)) {
            if (key === this.classListAdd) {
                container.classList.add(value);
            } else if (key === this.setId) {
                container.id = value;
            } else if (typeof(value) === "function") {
                value(container);
            } else {
                let itemContainer = document.createElement("div");
                container.appendChild(itemContainer);
                if (value === null) {
                    itemContainer.classList.add(CSSClasses.NullDictionaryEntry);
                    itemContainer.appendChild(this.CreateText(key, CSSClasses.NullKeyDefault));
                    itemContainer.appendChild(this.CreateItem(null, mappers));
                } else if (isString(value)) {
                    itemContainer.className = CSSClasses.SimpleDictionaryEntry;
                    itemContainer.appendChild(this.CreateText(key, CSSClasses.SimpleKeyDefault));
                    itemContainer.appendChild(this.CreateText("", CSSClasses.SimpleSeparator));
                    itemContainer.appendChild(this.CreateItem(value, mappers));
                } else {
                    itemContainer.className = CSSClasses.ComplexDictionaryEntry;

                    let entryHeader = document.createElement("div");
                    entryHeader.className = CSSClasses.ComplexEntryHeader;
                    entryHeader.appendChild(this.CreateText(key, CSSClasses.ComplexKeyDefault));
                    itemContainer.appendChild(entryHeader);

                    let entryBody = document.createElement("div");
                    entryBody.className = CSSClasses.ComplexEntryBody;
                    entryBody.appendChild(this.CreateItem(value, mappers));
                    itemContainer.appendChild(entryBody);
                }
            }
        }
        return container;
    }
}
