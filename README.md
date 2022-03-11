# trading-stellar-bot2

## Stellar Routes

### Create User
Registers users to the database.

- URL:
  * `/create`

- Method:
  * `GET`

- URL Params:
  * None

- Data Params:
  * `username=[string]`
  * `publickey=[string]`
  * `privatekey=[string]`

- Success Response:
  * Code: 201
  * Content: `{ success: true, message: User added! }`

- Error Response:
  * Code: 400
  * Content: `{ success: false, message: Please enter all fields }`
  
  OR  
  
  * Code: 500
  * Content: `{ success: false, message: 'example error message blla' }`

- Sample Call:
  ```
  https://(linktoapi)/create?username=helloworld&publickey=GBANPGJBMNQWHYGE4JD765JDJZBDHHP2T4BFWTNC4UL4DM3FU3UIQACU&privatekey=SCECAXI2H5TUCGCAWHJGFLMJOGQFOOHUZVYFCPRIVATEKEYGOESHERE
  
  // => 
  {
    success: true, message: User added!
  }
  ```
  
### Get account balance
Retrieves account balance.

- URL:
  * `/balance`

- Method:
  * `GET`

- URL Params:
  * None

- Data Params:
  * `publickey=[string]`

- Success Response:
  * Code: 200
  * Content: `{ success: true, balance: [{ "balance":"12.6105036", "buying_liabilities":"0.0000000", "selling_liabilities":"0.0000000", "asset_type":"native"}] }`

- Error Response:
  * Code: 500
  * Content: `{ success: false, message: 'example error message blla' }`

- Sample Call:
  ```
  https://(linktoapi)/balance?publickey=GA67XX2JAA4OCEXLUIRCWNVGX2M7IH7GJQKSSEANI5APNCLRDN53LVLD
  
  // => 
  {
    success: true, balance: [{ "balance":"12.6105036", "buying_liabilities":"0.0000000", "selling_liabilities":"0.0000000", "asset_type":"native"}]
  }
  ```
  
## Trading Routes
  
### Get Pair Price
Retrieves the latest price for the pair.

- URL:
  * `/pairprice`

- Method:
  * `GET`

- URL Params:
  * None

- Data Params:
  * `pair=[string]`

- Success Response:
  * Code: 200
  * Content: `{ success: true, pair: {"BNBUSDT": "380.50000000"} }`

- Error Response:
  * Code: 500
  * Content: `{ success: false, message: 'example error message blla' }`

- Sample Call:
  ```
  https://(linktoapi)/pairprice?pair=BNBUSDT
  
  // => 
  {
    success: true, pair: {"BNBUSDT": "380.50000000"}
  }
  ```
  
### Buy Offer
Sends buy offer to stellar network

- URL:
  * `/buy`

- Method:
  * `POST`

- URL Params:
  * None

- Data Params:
  * `publickey=[string]`
  * `sellingasset=[string]`
  * `buyingasset=[string]`
  * `amount=[string]`

- Success Response:
  * Code: 200
  * Content: `{ success: true, message: Buy Offer successfully sent! }`

- Error Response:
  * Code: 500
  * Content: `{ success: false, message: Error sending transaction, check console for more details }`

  OR  

  * Code: 500
  * Content: `{ success: false, message: 'example error message blla' }`

- Sample Call:
  ```
  https://(linktoapi)/buy?publickey=GBANPGJBMNQWHYGE4JD765JDJZBDHHP2T4BFWTNC4UL4DM3FU3UIQACU&sellingasset=USDC&buyingasset=BNB&amount=0.0001
  
  // => 
  {
    success: true, message: Buy Offer successfully sent!
  }
  ```
  
### Cancel Buy Offer
Cancels buy offer

- URL:
  * `/buy`

- Method:
  * `POST`

- URL Params:
  * `id=[string]`

- Data Params:
  * `publickey=[string]`
  * `sellingasset=[string]`
  * `buyingasset=[string]`

- Success Response:
  * Code: 200
  * Content: `{ success: true, message: Successfully canceled Buy Offer! }`

- Error Response:
  * Code: 500
  * Content: `{ success: false, message: Error sending transaction, check console for more details }`

  OR  

  * Code: 500
  * Content: `{ success: false, message: 'example error message blla' }`

- Sample Call:
  ```
  https://(linktoapi)/buy/950367139?publickey=GBANPGJBMNQWHYGE4JD765JDJZBDHHP2T4BFWTNC4UL4DM3FU3UIQACU&sellingasset=USDC&buyingasset=BNB
  
  // => 
  {
    success: true, message: Successfully canceled Buy Offer!
  }
  ```


### Sell Offer
Sends sell offer to stellar network

- URL:
  * `/sell`

- Method:
  * `POST`

- URL Params:
  * None

- Data Params:
  * `publickey=[string]`
  * `sellingasset=[string]`
  * `buyingasset=[string]`
  * `amount=[string]`

- Success Response:
  * Code: 200
  * Content: `{ success: true, message: Sell Offer successfully sent! }`

- Error Response:
  * Code: 500
  * Content: `{ success: false, message: Error sending transaction, check console for more details }`

  OR  

  * Code: 500
  * Content: `{ success: false, message: 'example error message blla' }`

- Sample Call:
  ```
  https://(linktoapi)/sell?publickey=GBANPGJBMNQWHYGE4JD765JDJZBDHHP2T4BFWTNC4UL4DM3FU3UIQACU&sellingasset=BNB&buyingasset=USDC&amount=0.0001
  
  // => 
  {
    success: true, message: Sell Offer successfully sent!
  }
  ```
  
### Cancel Sell Offer
Cancels sell offer

- URL:
  * `/sell`

- Method:
  * `POST`

- URL Params:
  * `id=[string]`

- Data Params:
  * `publickey=[string]`
  * `sellingasset=[string]`
  * `buyingasset=[string]`

- Success Response:
  * Code: 200
  * Content: `{ success: true, message: Successfully canceled Sell Offer! }`

- Error Response:
  * Code: 500
  * Content: `{ success: false, message: Error sending transaction, check console for more details }`

  OR  

  * Code: 500
  * Content: `{ success: false, message: 'example error message blla' }`

- Sample Call:
  ```
  https://(linktoapi)/sell/950367139?publickey=GBANPGJBMNQWHYGE4JD765JDJZBDHHP2T4BFWTNC4UL4DM3FU3UIQACU&sellingasset=BNB&buyingasset=USDC
  
  // => 
  {
    success: true, message: Successfully canceled Sell Offer!
  }
  ```
