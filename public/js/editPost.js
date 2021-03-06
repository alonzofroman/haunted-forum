const editPostForm = document.querySelector('#updatePostBtn');
const deletePost = document.querySelector('#deletePostBtn');
const editPostBtn = document.querySelector('.editPost');

var post_id;

const handleEditPost = async (e) => {
  const specific_location = document
    .querySelectorAll('.edit-modal-body input')[0]
    .value.trim();
  const image_link = document
    .querySelectorAll('.edit-modal-body input')[1]
    .value.trim();
  const title = document
    .querySelectorAll('.edit-modal-body input')[2]
    .value.trim();
  const body = document
    .querySelectorAll('.edit-modal-body textarea')[0]
    .value.trim();

  // console.log(specific_location, image_link, title, body);

  if (!specific_location || !image_link || !title || !body) {
    alert('Please fill in all the fields!');
    return;
  }

  if (body.length < 15) {
    alert('Make sure the body is longer than 15 characters!');
  }

  const response = await fetch(`/api/posts/${post_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      specific_location,
      image_link,
      title,
      body,
    }),
    headers: { 'Content-Type': 'application/json' },
  });

  response.ok
    ? document.location.replace('/dashboard')
    : alert('Post failed, try again!');
};

const handleDeletePost = async (e) => {
  const response = await fetch(`/api/posts/${post_id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  response.ok
    ? document.location.replace('/dashboard')
    : alert('Post failed, try again!');
};

const getPostId = (e) => {
  post_id = e.target.getAttribute('data-post');
  const post = JSON.parse(e.target.getAttribute('data-object'));
  document.querySelectorAll('.edit-modal-body input')[0].value =
    post['specific_location'];
  document.querySelectorAll('.edit-modal-body input')[1].value =
    post['image_link'];
  document.querySelectorAll('.edit-modal-body input')[2].value = post['title'];
  document.querySelectorAll('.edit-modal-body textarea')[0].value =
    post['body'];
};

editPostForm.addEventListener('click', handleEditPost);
deletePost.addEventListener('click', handleDeletePost);

if (editPostBtn) {
  editPostBtn.addEventListener('click', getPostId);
}
