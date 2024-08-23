const agg = [
  {
    '$match': {
      'product': new ObjectId('66c5c16abc895db217eb11f0')
    }
  }, {
    '$group': {
      '_id': null, 
      'averageRating': {
        '$avg': '$rating'
      }, 
      'numOfReviews': {
        '$sum': 1
      }
    }
  }
]