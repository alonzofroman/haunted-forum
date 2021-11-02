const router = require('express').Router();
const { User, Location, Post, Comment } = require('../../models');

// Only show the 10 most recent posts
router.get('/recent', async (req, res) => {
  try {
    const postData = await Post.findAll();

    !postData ? res.status(404).json(new Error('There was an error!')) : null;

    const postsPlain = await postData.map((p) => {
      return p.get({ plain: true });
    });
    const posts = postsPlain.slice(0, 10);
    res.render('mostrecent', { posts, loggedIn: req.session.loggedIn });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;