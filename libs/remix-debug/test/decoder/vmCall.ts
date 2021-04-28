'use strict'
var utileth = require('ethereumjs-util')
var Tx = require('@ethereumjs/tx').Transaction
import { Block } from '@ethereumjs/block'
var BN = require('ethereumjs-util').BN
var remixLib = require('@remix-project/remix-lib')
import VM from '@ethereumjs/vm'
import Common from '@ethereumjs/common'

export function sendTx (vm, from, to, value, data, cb) {
  var tx = new Tx({
    nonce: new BN(from.nonce++),
    gasPrice: new BN(1),
    gasLimit: new BN(3000000, 10),
    to: to,
    value: new BN(value, 10),
    data: Buffer.from(data, 'hex')
  })
  tx = tx.sign(from.privateKey)

  var block = Block.fromBlockData({
    header: {
      timestamp: new Date().getTime() / 1000 | 0,
      number: 0
    }
  }) // still using default common

  try {
    vm.runTx({block: block, tx: tx, skipBalance: true, skipNonce: true}).then(function (result) {
      setTimeout(() => {
        cb(null, utileth.bufferToHex(tx.hash()))
      }, 500)
    }).catch((error) => {
      console.error(error)
      cb(error)
    })
  } catch (e) {
    console.error(e)
  }
}

async function createVm (hardfork) {
  const common = new Common({ chain: 'mainnet', hardfork })
  const vm = new VM({ common })   
  await vm.init()
  // vm.blockchain.validate = false
  return { vm, stateManager: vm.stateManager }
}

/*
  Init VM / Send Transaction
*/
export async function initVM (st, privateKey) {
  var VM = await createVm('berlin')
  const vm = VM.vm

  var address = utileth.Address.fromPrivateKey(privateKey)
  vm.stateManager.getAccount(address).then((account) => {    
    account.balance = new BN('f00000000000000001', 16)
    vm.stateManager.putAccount(address, account).catch((error) => {
      console.log(error)
    })
  }).catch((error) => {
    console.log(error)
  })

  var web3Provider = new remixLib.vm.Web3VMProvider()
  web3Provider.setVM(vm)
  vm.web3 = web3Provider
  return vm
}

