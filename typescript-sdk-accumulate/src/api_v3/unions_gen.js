import * as types from "./index.js";
/** @ignore */
export var Record;
(function (Record) {
    function fromObject(obj) {
        if (obj instanceof types.AccountRecord)
            return obj;
        if (obj instanceof (types.ChainEntryRecord))
            return obj;
        if (obj instanceof types.ChainRecord)
            return obj;
        if (obj instanceof types.ErrorRecord)
            return obj;
        if (obj instanceof types.IndexEntryRecord)
            return obj;
        if (obj instanceof types.KeyRecord)
            return obj;
        if (obj instanceof types.MajorBlockRecord)
            return obj;
        if (obj instanceof (types.MessageRecord))
            return obj;
        if (obj instanceof types.MinorBlockRecord)
            return obj;
        if (obj instanceof (types.RecordRange))
            return obj;
        if (obj instanceof types.SignatureSetRecord)
            return obj;
        if (obj instanceof types.TxIDRecord)
            return obj;
        if (obj instanceof types.UrlRecord)
            return obj;
        switch (obj.recordType) {
            case types.RecordType.Account:
            case "account":
                return new types.AccountRecord(obj);
            case types.RecordType.ChainEntry:
            case "chainEntry":
                return new types.ChainEntryRecord(obj);
            case types.RecordType.Chain:
            case "chain":
                return new types.ChainRecord(obj);
            case types.RecordType.Error:
            case "error":
                return new types.ErrorRecord(obj);
            case types.RecordType.IndexEntry:
            case "indexEntry":
                return new types.IndexEntryRecord(obj);
            case types.RecordType.Key:
            case "key":
                return new types.KeyRecord(obj);
            case types.RecordType.MajorBlock:
            case "majorBlock":
                return new types.MajorBlockRecord(obj);
            case types.RecordType.Message:
            case "message":
                return new types.MessageRecord(obj);
            case types.RecordType.MinorBlock:
            case "minorBlock":
                return new types.MinorBlockRecord(obj);
            case types.RecordType.Range:
            case "range":
                return new types.RecordRange(obj);
            case types.RecordType.SignatureSet:
            case "signatureSet":
                return new types.SignatureSetRecord(obj);
            case types.RecordType.TxID:
            case "txID":
                return new types.TxIDRecord(obj);
            case types.RecordType.Url:
            case "url":
                return new types.UrlRecord(obj);
            default:
                throw new Error(`Unknown record '${obj.recordType}'`);
        }
    }
    Record.fromObject = fromObject;
})(Record || (Record = {}));
/** @ignore */
export var Query;
(function (Query) {
    function fromObject(obj) {
        if (obj instanceof types.AnchorSearchQuery)
            return obj;
        if (obj instanceof types.BlockQuery)
            return obj;
        if (obj instanceof types.ChainQuery)
            return obj;
        if (obj instanceof types.DataQuery)
            return obj;
        if (obj instanceof types.DefaultQuery)
            return obj;
        if (obj instanceof types.DelegateSearchQuery)
            return obj;
        if (obj instanceof types.DirectoryQuery)
            return obj;
        if (obj instanceof types.MessageHashSearchQuery)
            return obj;
        if (obj instanceof types.PendingQuery)
            return obj;
        if (obj instanceof types.PublicKeyHashSearchQuery)
            return obj;
        if (obj instanceof types.PublicKeySearchQuery)
            return obj;
        switch (obj.queryType) {
            case types.QueryType.AnchorSearch:
            case "anchorSearch":
                return new types.AnchorSearchQuery(obj);
            case types.QueryType.Block:
            case "block":
                return new types.BlockQuery(obj);
            case types.QueryType.Chain:
            case "chain":
                return new types.ChainQuery(obj);
            case types.QueryType.Data:
            case "data":
                return new types.DataQuery(obj);
            case types.QueryType.Default:
            case "default":
                return new types.DefaultQuery(obj);
            case types.QueryType.DelegateSearch:
            case "delegateSearch":
                return new types.DelegateSearchQuery(obj);
            case types.QueryType.Directory:
            case "directory":
                return new types.DirectoryQuery(obj);
            case types.QueryType.MessageHashSearch:
            case "messageHashSearch":
                return new types.MessageHashSearchQuery(obj);
            case types.QueryType.Pending:
            case "pending":
                return new types.PendingQuery(obj);
            case types.QueryType.PublicKeyHashSearch:
            case "publicKeyHashSearch":
                return new types.PublicKeyHashSearchQuery(obj);
            case types.QueryType.PublicKeySearch:
            case "publicKeySearch":
                return new types.PublicKeySearchQuery(obj);
            default:
                throw new Error(`Unknown query '${obj.queryType}'`);
        }
    }
    Query.fromObject = fromObject;
})(Query || (Query = {}));
/** @ignore */
export var Event;
(function (Event) {
    function fromObject(obj) {
        if (obj instanceof types.BlockEvent)
            return obj;
        if (obj instanceof types.ErrorEvent)
            return obj;
        if (obj instanceof types.GlobalsEvent)
            return obj;
        switch (obj.eventType) {
            case types.EventType.Block:
            case "block":
                return new types.BlockEvent(obj);
            case types.EventType.Error:
            case "error":
                return new types.ErrorEvent(obj);
            case types.EventType.Globals:
            case "globals":
                return new types.GlobalsEvent(obj);
            default:
                throw new Error(`Unknown event '${obj.eventType}'`);
        }
    }
    Event.fromObject = fromObject;
})(Event || (Event = {}));
//# sourceMappingURL=unions_gen.js.map