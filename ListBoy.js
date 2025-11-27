var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
function isIRenderSelf(item) {
    return 'Render' in item; // I could also check if it's a function or something, maybe later.
}
function isString(data) {
    return data.constructor === String;
}
var identity = {
    object: function (input) { return input; },
    string: function (input) { return input; },
};
function normalize(mappers) {
    return __assign(__assign({}, identity), mappers);
}
/** These are the CSS classes that ListBoy emits and recommends get styled by the caller */
var CSSClasses;
(function (CSSClasses) {
    /** A div rendered from an array */
    CSSClasses["Array"] = "array";
    /** A div rendered from a raw JSON object */
    CSSClasses["Dictionary"] = "dictionary";
    /** A div for a Dictionary Entry that is just `string: string` */
    CSSClasses["SimpleDictionaryEntry"] = "simple-dictionary-entry";
    /** A div for a Dicionary Entry that is more complex than `string: string` */
    CSSClasses["ComplexDictionaryEntry"] = "complex-dictionary-entry";
    /** A default span for a raw string */
    CSSClasses["StringDefault"] = "string-default";
    /** A default span for the key of a dictionary, i.e. a name of a JSON member, with a string value */
    CSSClasses["SimpleKeyDefault"] = "simple-key-default";
    /** An empty span between a simple key and a string value*/
    CSSClasses["SimpleSeparator"] = "simple-separator";
    /** A default span for the key of a dictionary, i.e. a name of a JSON member, with a complex value */
    CSSClasses["ComplexKeyDefault"] = "complex-key-default";
    /** A div which always contains the header of a complex entry */
    CSSClasses["ComplexEntryHeader"] = "complex-entry-header";
    /** A div which always contains the body of a complex entry */
    CSSClasses["ComplexEntryBody"] = "complex-entry-body";
    /** A div which always contains the header of a null-valued entry */
    CSSClasses["NullDictionaryEntry"] = "null-dictionary-entry";
    /** A default span for the key of a dictionary, i.e. a name of a JSON member, with a complex value */
    CSSClasses["NullKeyDefault"] = "null-key-default";
    /** A span which is a placeholder for a null value */
    CSSClasses["NullValue"] = "null-value";
})(CSSClasses || (CSSClasses = {}));
var MarkdownFormatting;
(function (MarkdownFormatting) {
    MarkdownFormatting["Emphasis"] = "em";
    MarkdownFormatting["Strong"] = "strong";
})(MarkdownFormatting || (MarkdownFormatting = {}));
/**
 * The class that knows how to render data objects
 * Usage:
 * ListBoy.RenderTo({}, "main");
 */
var ListBoy = /** @class */ (function () {
    function ListBoy() {
    }
    // private static fixMappers(){}
    /**
     * Renders the data object into the target DOM object (when it's ready to do so)
     * @param dataObject The data to render
     * @param targetId The ID of the DOM object to render it into
     * @param mappers mapping functions that will be called on appropriate objects in the tree (default is the identity function)
     */
    ListBoy.RenderTo = function (dataObject, targetId, mappers) {
        var _this = this;
        var cleanMappers = normalize(mappers);
        var ready = function () { return _this.ReadyToRenderTo(dataObject, targetId, cleanMappers); };
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", ready);
        }
        else {
            ready();
        }
    };
    /**
     * Renders the data object into the target DOM object (presuming it's ready to do so)
     * Precondition: The document is ready to get the document elements
     * @param dataObject The data to render
     * @param targetId The ID of the DOM object to render it into
     * @param objectMapper A mapping function that will be called on all (JSON) objects in the tree
     */
    ListBoy.ReadyToRenderTo = function (dataObject, targetId, mappers) {
        try {
            var target = document.getElementById(targetId);
            if (target === null) {
                throw new Error("ListBoy couldn't find your target: " + targetId);
            }
            target.appendChild(this.CreateItem(dataObject, mappers));
        }
        catch (ex) {
            alert(ex);
        }
    };
    /**
     * Builds a single item (not recommended for external use)
     * @param item The item to build
     * @param objectMapper A mapping function that will be called on all (JSON) objects in the tree (default is the identity function)
     */
    ListBoy.CreateItem = function (item, mappers) {
        if (item === null) {
            return this.CreateNull();
        }
        else if (item.constructor == Object) { // JSON
            return this.CreateData(mappers.object(item), mappers);
        }
        else if (typeof (item) == "number") {
            return document.createTextNode(item.toString());
        }
        else if (typeof (item) == "string") {
            return this.CreateText(mappers.string(item), CSSClasses.StringDefault);
        }
        else if (Array.isArray(item)) {
            return this.CreateArray(item, mappers);
        }
        else if (typeof (item) === "object") {
            if (isIRenderSelf(item)) {
                return item.Render(mappers);
            }
            else if (item.tagName === "SPAN") {
                return item;
            }
            else {
                throw new Error("Don't know how to build an object with tag: ".concat(item.tagName));
            }
        }
        else {
            throw new Error("Don't know how to build a ".concat(typeof item));
        }
    };
    ListBoy.MarkdownTag = function (content, format) {
        var element = document.createElement(format);
        element.innerHTML = content;
        return element;
    };
    /**
     * Creates a text Node, potentially inside a span (dealing with pseudo markdown)
     * @param item The string for the span
     * @param defaultClass The class to use (if it isn't markdown)
     */
    ListBoy.CreateText = function (item, defaultClass) {
        if (defaultClass === void 0) { defaultClass = null; }
        if (item[0] === "`") { // This is the indicator for markdown mode
            var pieces = item.substring(1).split("*");
            var format = null; // presume no formatting
            var displayedFormat = format;
            var container = document.createElement("span");
            for (var _i = 0, pieces_1 = pieces; _i < pieces_1.length; _i++) {
                var piece = pieces_1[_i];
                if (piece !== "") {
                    container.appendChild(this.MarkdownTag(piece, format));
                    displayedFormat = format;
                }
                // adjust language state
                if (format === null) { // First star always puts us into italics
                    format = MarkdownFormatting.Emphasis;
                }
                else {
                    if (piece === "") { // This means two consecutive stars
                        // This can't nest ** and *
                        if (format === MarkdownFormatting.Emphasis) {
                            // We need to know what we last printed
                            if (displayedFormat === MarkdownFormatting.Strong) {
                                format = null;
                            }
                            else {
                                format = MarkdownFormatting.Strong;
                            }
                        }
                        else {
                            format = MarkdownFormatting.Emphasis;
                        }
                    }
                    else {
                        if (format === MarkdownFormatting.Emphasis) {
                            format = null;
                        }
                        else {
                            format = MarkdownFormatting.Emphasis;
                        }
                    }
                }
            }
            return container;
        }
        else {
            var element = document.createElement("span");
            element.className = defaultClass;
            element.innerHTML = item;
            return element;
        }
    };
    /**
     * Creates a null value
     */
    ListBoy.CreateNull = function () {
        var container = document.createElement('span');
        container.className = CSSClasses.NullValue;
        return container;
    };
    /**
     * Creates data from an array
     * @param data The array data
     */
    ListBoy.CreateArray = function (data, mappers) {
        var container = document.createElement("div");
        container.className = CSSClasses.Array;
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var item = data_1[_i];
            if (typeof (item) === "function") {
                item(container);
            }
            else {
                container.appendChild(this.CreateItem(item, mappers));
            }
        }
        return container;
    };
    /** Builds as if from a dictionary */
    ListBoy.CreateData = function (data, mappers) {
        var container = document.createElement("div");
        container.className = CSSClasses.Dictionary;
        for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (key === this.classListAdd) {
                container.classList.add(value);
            }
            else if (key === this.setId) {
                container.id = value;
            }
            else if (typeof (value) === "function") {
                value(container);
            }
            else {
                var itemContainer = document.createElement("div");
                container.appendChild(itemContainer);
                if (value === null) {
                    itemContainer.classList.add(CSSClasses.NullDictionaryEntry);
                    itemContainer.appendChild(this.CreateText(key, CSSClasses.NullKeyDefault));
                    itemContainer.appendChild(this.CreateItem(null, mappers));
                }
                else if (isString(value)) {
                    itemContainer.className = CSSClasses.SimpleDictionaryEntry;
                    itemContainer.appendChild(this.CreateText(key, CSSClasses.SimpleKeyDefault));
                    itemContainer.appendChild(this.CreateText("", CSSClasses.SimpleSeparator));
                    itemContainer.appendChild(this.CreateItem(value, mappers));
                }
                else {
                    itemContainer.className = CSSClasses.ComplexDictionaryEntry;
                    var entryHeader = document.createElement("div");
                    entryHeader.className = CSSClasses.ComplexEntryHeader;
                    entryHeader.appendChild(this.CreateText(key, CSSClasses.ComplexKeyDefault));
                    itemContainer.appendChild(entryHeader);
                    var entryBody = document.createElement("div");
                    entryBody.className = CSSClasses.ComplexEntryBody;
                    entryBody.appendChild(this.CreateItem(value, mappers));
                    itemContainer.appendChild(entryBody);
                }
            }
        }
        return container;
    };
    /**
     * A variable (that is overridable in case you really need this text as a key) which is used to
     * add the specified class to the object.
     */
    ListBoy.classListAdd = "target.classList.add";
    ListBoy.setId = "target.id";
    return ListBoy;
}());
//# sourceMappingURL=ListBoy.js.map