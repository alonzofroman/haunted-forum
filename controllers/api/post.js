const router = require('express').Router();
const { User, Location, Post, Comment, Vote, Reply } = require('../../models');
// If they're not even logged in, immediately throw a forbidden 403
// For tasks we don't want to even risk initializing if they're not logged in
const { forbidIfNotLogged } = require('../../utils/forRoutes');
const date = new Date();
const sequelize = require('../../config/connection');

router
  .route('/')
  .post(forbidIfNotLogged, async (req, res) => {
    try {
      // //Find the user's posts
      // const userRecentPostData = await Post.findAll({
      //   where: {
      //     user_id: req.session.userId,
      //   },
      //   order: [['id', 'DESC']],
      // });

      // // This will be minutes since last post
      // let minutes;

      // // If the user has no posts, just let minutes be 60
      // if (userRecentPostData.length === 0) {
      //   minutes = 60;
      //   // Otherwise, minutes = compare the lastPostDate to our current date object declared at the top of doc
      // } else {
      //   const lastPostDate = userRecentPostData[0].dataValues.creation_date;

      //   minutes = parseInt(
      //     (Math.abs(date.getTime() - lastPostDate.getTime()) / (1000 * 60)) % 60
      //   );
      // }
      // // If minutes is less than 10, then they are DENIED
      // if (minutes < 10) {
      //   res
      //     .status(403)
      //     .json({ message: 'Can only post once every 10 minutes!' });
      //   return;
      // }

      // Find locations if it's a match
      const locationData = await Location.findOne({
        where: {
          name: req.body.location,
        },
      });

      let locationId;

      // If location not exist, create new one and grab the id
      if (locationData === null) {
        const newLocation = await Location.create({
          name: req.body.location,
        });
        locationId = newLocation.dataValues.id;
      } else {
        //If does exist, grab that id
        locationId = locationData.dataValues.id;
      }

      const newPost = await Post.create({
        creation_date: date,
        specific_location: req.body.specific_location,
        image_link: req.body.image_link,
        title: req.body.title,
        body: req.body.body,
        edited: false,
        // Perhaps this can be pulled from the params/query in the url
        location_id: locationId,
        // From the cookie. Posts it for the user currently logged in
        user_id: req.session.userId,
      });
      !newPost ? res.status(404).json(new Error('There was an error!')) : null;

      res.status(200).json(newPost);
    } catch (err) {
      res.status(500).json(err);
      console.log(err);
    }
  })
  .get(async (req, res) => {
    // ?location=SMTH
    try {
      const location = req.query.location;
      const locationData = await Location.findAll({
        where: {
          name: location,
        },
      });
      !location || !locationData
        ? res.status(404).json(new Error('There was an error!'))
        : null;
      const postData = await Post.findAll(
        {
          where: {
            location_id: locationData[0].dataValues.id,
          },
          order: [['id', 'DESC']],
        },
        {
          include: [{ model: User }],
        }
      );
      const posts = await postData.map((post) => {
        return post.get({ plain: true });
      });
      res.status(200).json(posts);
    } catch (err) {
      res.status(500).json(err);
    }
  });

router
  .route('/:id')
  .put(forbidIfNotLogged, async (req, res) => {
    try {
      const edited = await Post.update(
        {
          specific_location: req.body.specific_location,
          image_link: req.body.image_link,
          title: req.body.title,
          body: req.body.body,
          edited: true,
        },
        {
          where: {
            id: req.params.id,
            user_id: req.session.userId,
          },
        }
      );

      !edited ? res.status(404).json(new Error('There was an error!')) : null;

      res.status(200).json(edited);
    } catch (err) {
      res.status(500).json(err);
    }
  })
  .delete(forbidIfNotLogged, async (req, res) => {
    try {
      const deleted = await Post.destroy({
        // Will only delete the post if the post ID and the user ID match - just a security measure
        where: {
          id: req.params.id,
          // Extra layer of security
          user_id: req.session.userId,
        },
      });

      !deleted ? res.status(404).json(new Error('There was an error!')) : null;

      res.status(200).json(deleted);
    } catch (err) {
      res.status(500).json(err);
    }
  });

router
  .route('/:id/comment')
  .post(forbidIfNotLogged, async (req, res) => {
    try {
      console.log(req.body, req.params);
      const commented = await Comment.create({
        creation_date: date,
        body: req.body.body,
        user_id: req.session.userId,
        post_id: req.params.id,
      });
      console.log(commented);
      !commented
        ? res.status(404).json(new Error('There was an error!'))
        : null;

      res.status(200).json(commented);
    } catch (err) {
      res.status(500).json(err);
      console.log(err);
    }
  })
  // Editing comments - THIS IS NOT COMPLETE - one of the last features to implement
  .put(forbidIfNotLogged, async (req, res) => {
    try {
      const editedComment = await Comment.update(
        {
          body: req.body.body,
        },
        {
          where: {
            id: req.body.id,
          },
        }
      );
    } catch (err) {
      res.status(500).json(err);
    }
  })
  .delete(forbidIfNotLogged, async (req, res) => {
    try {
      const deleted = await Comment.destroy({
        where: {
          id: req.body.id,
          // Just a second layer of security
          // Will also only display delete buttons on that user's comments
          user_id: req.session.userId,
        },
      });

      !deleted ? res.status(404).json(new Error('There was an error!')) : null;

      res.status(200).json(deleted);
    } catch (err) {
      res.status(500).json(err);
    }
  });

router.post('/:id/upvote', async (req, res) => {
  try {
    // console.log(req.params.id);
    const votesData = await Vote.findAll({
      where: { user_id: req.session.userId, post_id: req.params.id },
    });

    if (votesData.length > 0) {
      res.status(403).json('Cannot vote twice');
      return;
    }

    const voteCount = await sequelize.query(
      `UPDATE post SET up_votes = up_votes + 1 WHERE id=${req.params.id}`
    );
    !voteCount ? res.status(400).json('Vote failed') : null;

    const votedFor = await Vote.create({
      user_id: req.session.userId,
      post_id: req.params.id,
    });

    res.status(200).json({ votedFor, voteCount });
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});

router.post('/comments/:id/reply', async (req, res) => {
  try {
    const replyData = Reply.create({
      creation_date: date,
      body: req.body.body,
      user_id: req.session.userId,
      comment_id: req.body.comment_id,
    });

    !replyData ? res.status(400).json('There was an error!') : null;

    res.status(200).json(replyData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete('/comments/reply/:id', async (req, res) => {
  try {
    const deleteReply = await Reply.destroy({
      where: {
        id: req.params.id,
        user_id: req.session.userId,
      },
    });

    !deleteReply
      ? res.status(404).json(new Error('There was an error!'))
      : null;

    res.status(200).json(deleteReply);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
