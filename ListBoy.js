﻿/**
 * this class declares a "point of view"
 * but it also can be used to describe the object of the verb too...
 */
var POV = /** @class */ (function () {
    function POV(
    // Admittedly this looks transposed in code,
    // but the order is more native to me from language studies
    first_singular, second_singluar, third_singular, first_plural, second_plural, third_plural) {
        this.data = [
            [first_singular, first_plural],
            [second_singluar, second_plural],
            [third_singular, third_plural],
        ];
    }
    POV.prototype.table = function () {
        var table = document.createElement("table");
        for (var _i = 0, _a = this.data; _i < _a.length; _i++) {
            var row = _a[_i];
            var tableRow = document.createElement("tr");
            table.appendChild(tableRow);
            for (var _b = 0, row_1 = row; _b < row_1.length; _b++) {
                var column = row_1[_b];
                var tableData = document.createElement("td");
                tableRow.appendChild(tableData);
                tableData.appendChild(ListBoy.CreateItem(column));
            }
        }
        return table;
    };
    return POV;
}());
function isString(data) {
    return data.constructor === String;
}
/** These are the CSS classes that ListBoy emits and recommends get styled by the caller */
var CSSClasses;
(function (CSSClasses) {
    /** A div rendered from an array */
    CSSClasses["Array"] = "array";
    /** A div rendered from a raw JSON object */
    CSSClasses["Dictionary"] = "dictionary";
    /** A span for a raw string */
    CSSClasses["String"] = "string";
    /** A div for a Dictionary Entry that is just `string: string` */
    CSSClasses["SimpleDictionaryEntry"] = "simple-dictionary-entry";
    /** A div for a Dicionary Entry that is more complex than `string: string` */
    CSSClasses["ComplexDictionaryEntry"] = "complex-dictionary-entry";
    /** A default span for the key of a dictionary, i.e. a name of a JSON member, with a string value */
    CSSClasses["SimpleKeyDefault"] = "simple-key-default";
    /** A default span for the key of a dictionary, i.e. a name of a JSON member, with a complex value */
    CSSClasses["ComplexKeyDefault"] = "complex-key-default";
    /** A div which always contains the header of a complex entry */
    CSSClasses["ComplexEntryHeader"] = "complex-entry-header";
    /** A div which always contains the body of a complex entry */
    CSSClasses["ComplexEntryBody"] = "complex-entry-body";
})(CSSClasses || (CSSClasses = {}));
var MarkdownFormatting;
(function (MarkdownFormatting) {
    MarkdownFormatting["Emphasis"] = "em";
    MarkdownFormatting["Strong"] = "strong";
})(MarkdownFormatting || (MarkdownFormatting = {}));
/**
 * The class that knows how to render data objects
 * Usage:
 * ListBoy.Render({}, "main");
 */
var ListBoy = /** @class */ (function () {
    function ListBoy() {
    }
    /**
     * Renders the data object into the target DOM object
     * @param dataObject The data to render
     * @param targetId The ID of the DOM object to render it into
     */
    ListBoy.RenderTo = function (dataObject, targetId) {
        var _this = this;
        document.addEventListener("DOMContentLoaded", function (event) {
            document.getElementById(targetId).appendChild(_this.CreateItem(dataObject));
        });
    };
    /**
     * Builds a single item (not recommended for external use)
     * @param item The item to build
     */
    ListBoy.CreateItem = function (item) {
        if (item instanceof POV) {
            return item.table();
        }
        else if (item.constructor == Object) { // JSON
            return this.CreateData(item);
        }
        else if (typeof (item) == "number") {
            return document.createTextNode(item.toString());
        }
        else if (typeof (item) == "string") {
            return this.CreateText(item, CSSClasses.String);
        }
        else if (Array.isArray(item)) {
            return this.CreateArray(item);
        }
        else if (typeof (item) === "object") {
            if (item.tagName === "SPAN") {
                return item;
            }
            else {
                alert("Don't know how to build an object with tag: " + item.tagName);
            }
        }
        else {
            alert("Don't know how to build a " + typeof item);
        }
    };
    ListBoy.MarkdownTag = function (content, format) {
        if (format === null) {
            return document.createTextNode(content);
        }
        var element = document.createElement(format);
        // Gah, Hack to support <sup> blocks.
        element.innerHTML = content;
        // element.appendChild(document.createTextNode(content));
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
            var container = document.createElement("span");
            for (var _i = 0, pieces_1 = pieces; _i < pieces_1.length; _i++) {
                var piece = pieces_1[_i];
                if (piece !== "") {
                    container.appendChild(this.MarkdownTag(piece, format));
                }
                // adjust language state
                if (format === null) { // One star always puts us into italics
                    format = MarkdownFormatting.Emphasis;
                }
                else {
                    if (piece === "") { // This means two stars
                        // I'm not convinced this works with nested ** and *
                        if (format === MarkdownFormatting.Emphasis) {
                            format = MarkdownFormatting.Strong;
                        }
                        else {
                            format = MarkdownFormatting.Emphasis;
                        }
                    }
                    else {
                        format = null;
                    }
                }
            }
            return container;
        }
        else {
            var element = document.createElement("span");
            element.className = defaultClass;
            element.appendChild(document.createTextNode(item));
            // element.innerHTML = item;
            return element;
        }
    };
    /**
     * Creates data from an array
     * @param data The array data
     */
    ListBoy.CreateArray = function (data) {
        var container = document.createElement("div");
        container.className = CSSClasses.Array;
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var item = data_1[_i];
            container.appendChild(this.CreateItem(item));
        }
        return container;
    };
    /** Builds as if from a dictionary */
    ListBoy.CreateData = function (data) {
        var container = document.createElement("div");
        container.className = CSSClasses.Dictionary;
        for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (typeof (value) === "function") {
                value(container);
            }
            else {
                var itemContainer = document.createElement("div");
                container.appendChild(itemContainer);
                if (isString(value)) {
                    itemContainer.className = CSSClasses.SimpleDictionaryEntry;
                    itemContainer.appendChild(this.CreateText(key, CSSClasses.SimpleKeyDefault));
                    itemContainer.appendChild(document.createTextNode(" ")); // emspace
                    itemContainer.appendChild(this.CreateItem(value));
                }
                else {
                    itemContainer.className = CSSClasses.ComplexDictionaryEntry;
                    var entryHeader = document.createElement("div");
                    entryHeader.className = CSSClasses.ComplexEntryHeader;
                    entryHeader.appendChild(this.CreateText(key, CSSClasses.ComplexKeyDefault));
                    itemContainer.appendChild(entryHeader);
                    var entryBody = document.createElement("div");
                    entryBody.className = CSSClasses.ComplexEntryBody;
                    entryBody.appendChild(this.CreateItem(value));
                    itemContainer.appendChild(entryBody);
                }
            }
        }
        return container;
    };
    return ListBoy;
}());
//# sourceMappingURL=ListBoy.js.map