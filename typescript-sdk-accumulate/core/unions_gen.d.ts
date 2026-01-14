import * as types from "./types_gen.js";
export type Account = types.ADI | types.AnchorLedger | types.BlockLedger | types.DataAccount | types.KeyBook | types.KeyPage | types.LiteDataAccount | types.LiteIdentity | types.LiteTokenAccount | types.SyntheticLedger | types.SystemLedger | types.TokenAccount | types.TokenIssuer | types.UnknownAccount | types.UnknownSigner;
export type AccountArgs = types.ADI | types.ADIArgsWithType | types.AnchorLedger | types.AnchorLedgerArgsWithType | types.BlockLedger | types.BlockLedgerArgsWithType | types.DataAccount | types.DataAccountArgsWithType | types.KeyBook | types.KeyBookArgsWithType | types.KeyPage | types.KeyPageArgsWithType | types.LiteDataAccount | types.LiteDataAccountArgsWithType | types.LiteIdentity | types.LiteIdentityArgsWithType | types.LiteTokenAccount | types.LiteTokenAccountArgsWithType | types.SyntheticLedger | types.SyntheticLedgerArgsWithType | types.SystemLedger | types.SystemLedgerArgsWithType | types.TokenAccount | types.TokenAccountArgsWithType | types.TokenIssuer | types.TokenIssuerArgsWithType | types.UnknownAccount | types.UnknownAccountArgsWithType | types.UnknownSigner | types.UnknownSignerArgsWithType;
/** @ignore */
export declare namespace Account {
    function fromObject(obj: AccountArgs): Account;
}
export type DataEntry = types.AccumulateDataEntry | types.DoubleHashDataEntry | types.FactomDataEntryWrapper;
export type DataEntryArgs = types.AccumulateDataEntry | types.AccumulateDataEntryArgsWithType | types.DoubleHashDataEntry | types.DoubleHashDataEntryArgsWithType | types.FactomDataEntryWrapper | types.FactomDataEntryWrapperArgsWithType;
/** @ignore */
export declare namespace DataEntry {
    function fromObject(obj: DataEntryArgs): DataEntry;
}
export type TransactionBody = types.AcmeFaucet | types.ActivateProtocolVersion | types.AddCredits | types.BlockValidatorAnchor | types.BurnCredits | types.BurnTokens | types.CreateDataAccount | types.CreateIdentity | types.CreateKeyBook | types.CreateKeyPage | types.CreateLiteTokenAccount | types.CreateToken | types.CreateTokenAccount | types.DirectoryAnchor | types.IssueTokens | types.LockAccount | types.NetworkMaintenance | types.RemoteTransaction | types.SendTokens | types.SyntheticBurnTokens | types.SyntheticCreateIdentity | types.SyntheticDepositCredits | types.SyntheticDepositTokens | types.SyntheticForwardTransaction | types.SyntheticWriteData | types.SystemGenesis | types.SystemWriteData | types.TransferCredits | types.UpdateAccountAuth | types.UpdateKey | types.UpdateKeyPage | types.WriteData | types.WriteDataTo;
export type TransactionBodyArgs = types.AcmeFaucet | types.AcmeFaucetArgsWithType | types.ActivateProtocolVersion | types.ActivateProtocolVersionArgsWithType | types.AddCredits | types.AddCreditsArgsWithType | types.BlockValidatorAnchor | types.BlockValidatorAnchorArgsWithType | types.BurnCredits | types.BurnCreditsArgsWithType | types.BurnTokens | types.BurnTokensArgsWithType | types.CreateDataAccount | types.CreateDataAccountArgsWithType | types.CreateIdentity | types.CreateIdentityArgsWithType | types.CreateKeyBook | types.CreateKeyBookArgsWithType | types.CreateKeyPage | types.CreateKeyPageArgsWithType | types.CreateLiteTokenAccount | types.CreateLiteTokenAccountArgsWithType | types.CreateToken | types.CreateTokenArgsWithType | types.CreateTokenAccount | types.CreateTokenAccountArgsWithType | types.DirectoryAnchor | types.DirectoryAnchorArgsWithType | types.IssueTokens | types.IssueTokensArgsWithType | types.LockAccount | types.LockAccountArgsWithType | types.NetworkMaintenance | types.NetworkMaintenanceArgsWithType | types.RemoteTransaction | types.RemoteTransactionArgsWithType | types.SendTokens | types.SendTokensArgsWithType | types.SyntheticBurnTokens | types.SyntheticBurnTokensArgsWithType | types.SyntheticCreateIdentity | types.SyntheticCreateIdentityArgsWithType | types.SyntheticDepositCredits | types.SyntheticDepositCreditsArgsWithType | types.SyntheticDepositTokens | types.SyntheticDepositTokensArgsWithType | types.SyntheticForwardTransaction | types.SyntheticForwardTransactionArgsWithType | types.SyntheticWriteData | types.SyntheticWriteDataArgsWithType | types.SystemGenesis | types.SystemGenesisArgsWithType | types.SystemWriteData | types.SystemWriteDataArgsWithType | types.TransferCredits | types.TransferCreditsArgsWithType | types.UpdateAccountAuth | types.UpdateAccountAuthArgsWithType | types.UpdateKey | types.UpdateKeyArgsWithType | types.UpdateKeyPage | types.UpdateKeyPageArgsWithType | types.WriteData | types.WriteDataArgsWithType | types.WriteDataTo | types.WriteDataToArgsWithType;
/** @ignore */
export declare namespace TransactionBody {
    function fromObject(obj: TransactionBodyArgs): TransactionBody;
}
export type AccountAuthOperation = types.AddAccountAuthorityOperation | types.DisableAccountAuthOperation | types.EnableAccountAuthOperation | types.RemoveAccountAuthorityOperation;
export type AccountAuthOperationArgs = types.AddAccountAuthorityOperation | types.AddAccountAuthorityOperationArgsWithType | types.DisableAccountAuthOperation | types.DisableAccountAuthOperationArgsWithType | types.EnableAccountAuthOperation | types.EnableAccountAuthOperationArgsWithType | types.RemoveAccountAuthorityOperation | types.RemoveAccountAuthorityOperationArgsWithType;
/** @ignore */
export declare namespace AccountAuthOperation {
    function fromObject(obj: AccountAuthOperationArgs): AccountAuthOperation;
}
export type KeyPageOperation = types.AddKeyOperation | types.RemoveKeyOperation | types.SetRejectThresholdKeyPageOperation | types.SetResponseThresholdKeyPageOperation | types.SetThresholdKeyPageOperation | types.UpdateAllowedKeyPageOperation | types.UpdateKeyOperation;
export type KeyPageOperationArgs = types.AddKeyOperation | types.AddKeyOperationArgsWithType | types.RemoveKeyOperation | types.RemoveKeyOperationArgsWithType | types.SetRejectThresholdKeyPageOperation | types.SetRejectThresholdKeyPageOperationArgsWithType | types.SetResponseThresholdKeyPageOperation | types.SetResponseThresholdKeyPageOperationArgsWithType | types.SetThresholdKeyPageOperation | types.SetThresholdKeyPageOperationArgsWithType | types.UpdateAllowedKeyPageOperation | types.UpdateAllowedKeyPageOperationArgsWithType | types.UpdateKeyOperation | types.UpdateKeyOperationArgsWithType;
/** @ignore */
export declare namespace KeyPageOperation {
    function fromObject(obj: KeyPageOperationArgs): KeyPageOperation;
}
export type Signature = types.AuthoritySignature | types.BTCLegacySignature | types.BTCSignature | types.DelegatedSignature | types.ED25519Signature | types.ETHSignature | types.EcdsaSha256Signature | types.InternalSignature | types.LegacyED25519Signature | types.PartitionSignature | types.RCD1Signature | types.ReceiptSignature | types.RemoteSignature | types.RsaSha256Signature | types.SignatureSet | types.TypedDataSignature;
export type SignatureArgs = types.AuthoritySignature | types.AuthoritySignatureArgsWithType | types.BTCLegacySignature | types.BTCLegacySignatureArgsWithType | types.BTCSignature | types.BTCSignatureArgsWithType | types.DelegatedSignature | types.DelegatedSignatureArgsWithType | types.ED25519Signature | types.ED25519SignatureArgsWithType | types.ETHSignature | types.ETHSignatureArgsWithType | types.EcdsaSha256Signature | types.EcdsaSha256SignatureArgsWithType | types.InternalSignature | types.InternalSignatureArgsWithType | types.LegacyED25519Signature | types.LegacyED25519SignatureArgsWithType | types.PartitionSignature | types.PartitionSignatureArgsWithType | types.RCD1Signature | types.RCD1SignatureArgsWithType | types.ReceiptSignature | types.ReceiptSignatureArgsWithType | types.RemoteSignature | types.RemoteSignatureArgsWithType | types.RsaSha256Signature | types.RsaSha256SignatureArgsWithType | types.SignatureSet | types.SignatureSetArgsWithType | types.TypedDataSignature | types.TypedDataSignatureArgsWithType;
/** @ignore */
export declare namespace Signature {
    function fromObject(obj: SignatureArgs): Signature;
}
export type NetworkMaintenanceOperation = types.PendingTransactionGCOperation;
export type NetworkMaintenanceOperationArgs = types.PendingTransactionGCOperation | types.PendingTransactionGCOperationArgsWithType;
/** @ignore */
export declare namespace NetworkMaintenanceOperation {
    function fromObject(obj: NetworkMaintenanceOperationArgs): NetworkMaintenanceOperation;
}
