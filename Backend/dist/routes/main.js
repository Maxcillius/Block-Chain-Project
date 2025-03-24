"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ethers_1 = require("ethers");
const PackageVerification_json_1 = __importDefault(require("./PackageVerification.json"));
const contractAddress = process.env.CONTRACT_ADDRESS;
const provider = new ethers_1.ethers.JsonRpcProvider(process.env.LOCALHOST_URL);
const router = (0, express_1.Router)();
router.post("/checkData", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { privateKey, hashData } = req.body;
        if (!privateKey || !hashData) {
            return res.status(400).json({
                ok: false,
                message: "Private key or hashData is required"
            });
        }
        const signer = new ethers_1.ethers.Wallet(privateKey, provider);
        const lockContract = new ethers_1.ethers.Contract(contractAddress, PackageVerification_json_1.default.abi, signer);
        const packageInfo = yield lockContract.getPackageInfo(hashData);
        const packageExists = packageInfo && packageInfo[0] !== '' && packageInfo[0] !== '0x0000000000000000000000000000000000000000';
        if (packageExists) {
            return res.json({
                ok: true,
                message: "Package verified successfully"
            });
        }
        else {
            return res.json({
                ok: false,
                message: "Package not found"
            });
        }
    }
    catch (error) {
        console.error("Error in checkData:", error);
        return res.status(500).json({
            ok: false,
            message: "Something went wrong",
            // error: error.message
        });
    }
}));
router.post("/getData", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { privateKey, hashData } = req.body;
        if (!privateKey || !hashData) {
            return res.status(400).json({
                ok: false,
                message: "Private key and hashData are required"
            });
        }
        const signer = new ethers_1.ethers.Wallet(privateKey, provider);
        const lockContract = new ethers_1.ethers.Contract(contractAddress, PackageVerification_json_1.default.abi, signer);
        const packageInfo = yield lockContract.getPackageInfo(hashData);
        console.log("Raw package info:", packageInfo);
        if (!packageInfo || packageInfo[0] === '' || packageInfo[0] === '0x0000000000000000000000000000000000000000') {
            return res.json({
                ok: false,
                message: "No package data found"
            });
        }
        return res.json({
            ok: true,
            data: {
                senderID: packageInfo[0],
                recipientID: packageInfo[1],
                aidType: packageInfo[2],
                timestamp: packageInfo[3].toString(),
            }
        });
    }
    catch (error) {
        console.error("Error in getData:", error);
        return res.status(500).json({
            ok: false,
            message: "Something went wrong",
            // error: error.message
        });
    }
}));
router.post("/storeData", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { privateKey, senderID, recipientID, aidType, location } = req.body;
        if (!privateKey || !senderID || !recipientID || !aidType || !location) {
            return res.status(400).json({
                ok: false,
                message: "Missing required fields: privateKey, senderID, recipientID, aidType, and location are all required",
            });
        }
        const signer = new ethers_1.ethers.Wallet(privateKey, provider);
        const lockContract = new ethers_1.ethers.Contract(contractAddress, PackageVerification_json_1.default.abi, signer);
        const data = {
            location,
            timestamp: Date.now()
        };
        const hashData = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(JSON.stringify(data)));
        try {
            const tx = yield lockContract.storePackage(senderID, recipientID, aidType, hashData);
            const receipt = yield tx.wait();
            console.log("Transaction receipt:", receipt);
            return res.status(201).json({
                ok: true,
                message: "Package data saved successfully",
                data: {
                    hashData: hashData,
                    txHash: tx.hash,
                    contractAddress: tx.to,
                    sender: tx.from
                },
            });
        }
        catch (error) {
            console.error("Contract error:", error);
            return res.status(400).json({
                ok: false,
                message: "Failed to store package data",
                // error: error.message
            });
        }
    }
    catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({
            ok: false,
            message: "Internal server error",
            // error: error.message
        });
    }
}));
exports.default = router;
