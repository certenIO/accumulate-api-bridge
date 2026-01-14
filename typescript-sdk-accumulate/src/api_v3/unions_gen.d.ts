import * as types from "./index.js";
import * as messaging from "../messaging/index.js";
export type Record = types.AccountRecord | types.ChainEntryRecord<Record> | types.ChainRecord | types.ErrorRecord | types.IndexEntryRecord | types.KeyRecord | types.MajorBlockRecord | types.MessageRecord<messaging.Message> | types.MinorBlockRecord | types.RecordRange<Record> | types.SignatureSetRecord | types.TxIDRecord | types.UrlRecord;
export type RecordArgs = types.AccountRecord | types.AccountRecordArgsWithType | types.ChainEntryRecord<Record> | types.ChainEntryRecordArgsWithType<Record> | types.ChainRecord | types.ChainRecordArgsWithType | types.ErrorRecord | types.ErrorRecordArgsWithType | types.IndexEntryRecord | types.IndexEntryRecordArgsWithType | types.KeyRecord | types.KeyRecordArgsWithType | types.MajorBlockRecord | types.MajorBlockRecordArgsWithType | types.MessageRecord<messaging.Message> | types.MessageRecordArgsWithType<messaging.Message> | types.MinorBlockRecord | types.MinorBlockRecordArgsWithType | types.RecordRange<Record> | types.RecordRangeArgsWithType<Record> | types.SignatureSetRecord | types.SignatureSetRecordArgsWithType | types.TxIDRecord | types.TxIDRecordArgsWithType | types.UrlRecord | types.UrlRecordArgsWithType;
/** @ignore */
export declare namespace Record {
    function fromObject(obj: RecordArgs): Record;
}
export type Query = types.AnchorSearchQuery | types.BlockQuery | types.ChainQuery | types.DataQuery | types.DefaultQuery | types.DelegateSearchQuery | types.DirectoryQuery | types.MessageHashSearchQuery | types.PendingQuery | types.PublicKeyHashSearchQuery | types.PublicKeySearchQuery;
export type QueryArgs = types.AnchorSearchQuery | types.AnchorSearchQueryArgsWithType | types.BlockQuery | types.BlockQueryArgsWithType | types.ChainQuery | types.ChainQueryArgsWithType | types.DataQuery | types.DataQueryArgsWithType | types.DefaultQuery | types.DefaultQueryArgsWithType | types.DelegateSearchQuery | types.DelegateSearchQueryArgsWithType | types.DirectoryQuery | types.DirectoryQueryArgsWithType | types.MessageHashSearchQuery | types.MessageHashSearchQueryArgsWithType | types.PendingQuery | types.PendingQueryArgsWithType | types.PublicKeyHashSearchQuery | types.PublicKeyHashSearchQueryArgsWithType | types.PublicKeySearchQuery | types.PublicKeySearchQueryArgsWithType;
/** @ignore */
export declare namespace Query {
    function fromObject(obj: QueryArgs): Query;
}
export type Event = types.BlockEvent | types.ErrorEvent | types.GlobalsEvent;
export type EventArgs = types.BlockEvent | types.BlockEventArgsWithType | types.ErrorEvent | types.ErrorEventArgsWithType | types.GlobalsEvent | types.GlobalsEventArgsWithType;
/** @ignore */
export declare namespace Event {
    function fromObject(obj: EventArgs): Event;
}
