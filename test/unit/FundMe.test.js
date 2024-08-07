const { assert, expect } = require("chai")
const { deployments, ethers } = require("hardhat")
const { waffle } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
!developmentChains.includes(network.name) // only run on local networks
    ? describe.skip
    : describe("Fund Me Contract Test", async () => {
          let fundMe
          let mockV3Aggregator
          //const sendValue = ethers.utils.parseEther("1")

          beforeEach(async () => {
              // deploy all contracts
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await deployments.get("FundMe")
              mockV3Aggregator = await deployments.get("MockV3Aggregator")
              fundMe = await ethers.getContractAt(fundMe.abi, fundMe.address)
              mockV3Aggregator = await ethers.getContractAt(
                  mockV3Aggregator.abi,
                  mockV3Aggregator.address
              )
          })

          describe("constructor", async () => {
              it("should set aggregator addresses correctly", async () => {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.target)
              })
          })
          describe("fund", async () => {
              it("Fails if you don't send enough eth", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("Updated the amount funded in the data structure", async () => {
                  const sendValue = ethers.parseEther("1")

                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of getFunder", async () => {
                  const sendValue = ethers.parseEther("1")

                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", async () => {
              beforeEach(async () => {
                  const sendValue = ethers.parseEther("1")
                  await fundMe.fund({ value: sendValue })
              })
              it("Withdraw ETH from a single founder", async () => {
                  //Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  //Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const EndingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target
                  )
                  const EndingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  //gascost?
                  //Assert
                  assert.equal(EndingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      EndingDeployerBalance + gasCost
                  )
              })
              //
              it(" allows us to withdraw with multiple getFunder", async () => {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  const sendValue = ethers.parseEther("1") // loops all accounts
                  for (i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      ) // loops all accounts and connect to fundMe contract
                      await fundMeConnectedContract.fund({ value: sendValue }) // loops all accounts and fund to fundMe contract
                  }
                  // now checking both balance
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  // Let's comapre gas costs :)
                  // const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait()
                  const { gasUsed, gasPrice } = transactionReceipt
                  const withdrawGasCost = gasUsed * gasPrice
                  console.log(`GasCost: ${withdrawGasCost}`)
                  console.log(`GasUsed: ${gasUsed}`)
                  console.log(`GasPrice: ${gasPrice}`)
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + withdrawGasCost
                  )
                  // make sure that getFunder are reset properly
                  // Make a getter for storage variables
                  await expect(fundMe.getFunder(0)).to.be.reverted //address[] private s_getFunder;

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(accounts[i]),
                          0
                      ) // make sure all accounts are 0 >>mapping(address => uint256) private s_getAddressToAmountFunded;
                  }
              })
              it("Only allows the owner to withdraw!", async () => {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = fundMe.connect(attacker)
                  await expect(attackerConnectedContract.withdraw()).to.be
                      .reverted
              })
              it("cheaper withdraw!....", async () => {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  const sendValue = ethers.parseEther("1") // loops all accounts
                  for (i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      ) // loops all accounts and connect to fundMe contract
                      await fundMeConnectedContract.fund({ value: sendValue }) // loops all accounts and fund to fundMe contract
                  }
                  // now checking both balance
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  // Let's comapre gas costs :)
                  // const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait()
                  const { gasUsed, gasPrice } = transactionReceipt
                  const withdrawGasCost = gasUsed * gasPrice
                  console.log(`GasCost: ${withdrawGasCost}`)
                  console.log(`GasUsed: ${gasUsed}`)
                  console.log(`GasPrice: ${gasPrice}`)
                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance + startingDeployerBalance,
                      endingDeployerBalance + withdrawGasCost
                  )
                  // make sure that getFunder are reset properly
                  // Make a getter for storage variables
                  await expect(fundMe.getFunder(0)).to.be.reverted //address[] private s_getFunder;

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(accounts[i]),
                          0
                      ) // make sure all accounts are 0 >>mapping(address => uint256) private s_getAddressToAmountFunded;
                  }
              })
          })
      })
