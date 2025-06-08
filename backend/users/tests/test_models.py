from django.test import TestCase
from django.contrib.auth import get_user_model
# from django.db.utils import DataError

class UsersManagersTests(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.User = get_user_model()
        cls.email = "testemail@gmail.com"
        cls.password = "testpassword"
        cls.first_name = "Test"
        cls.last_name = "User"
        cls.user = cls.User(email=cls.email, first_name=cls.first_name, last_name=cls.last_name)
        cls.user.set_password(cls.password)
        cls.user.save()

    def test_id(self):
        self.assertIsNotNone(self.user.id) # type: ignore
        self.assertEqual(self.user.id.__class__.__name__, "UUID") # type: ignore

    def test_date_joined(self):
        self.assertIsNotNone(self.user.date_joined)
        self.assertEqual(self.user.date_joined.__class__.__name__, "datetime")
    
    def test_first_name(self):
        self.assertEqual(self.user.first_name, self.first_name)
        user2 = self.User.objects.create(email="t2@test.com", password="foo")
        user2.first_name = "a"*101
        user2.last_name = "b"*101
        # if first/last_name > 100 => truncation, so no error should be raised
        # self.assertRaises(DataError, user2.save)
        user2.save()
        self.assertEqual(user2.first_name, "a"*100)
        self.assertEqual(user2.last_name, "b"*100)
    
    def test_str(self):
        str_user = " ".join([self.first_name, self.last_name])
        self.assertEqual(str(self.user), str_user)
    
    def test_create_user(self):
        self.assertEqual(get_user_model().objects.count(), 1)
        self.assertEqual(self.user.email, self.email)
        self.assertEqual(self.user.first_name, self.first_name)
        self.assertEqual(self.user.last_name, self.last_name)
        self.assertTrue(self.user.is_active)
        self.assertFalse(self.user.is_staff)
        self.assertFalse(self.user.is_superuser)

        self.assertIsNone(self.user.username)
        
        with self.assertRaises(ValueError):
            self.User.objects.create()

        with self.assertRaises(ValueError):
            self.User.objects.create(email="")

        with self.assertRaises(ValueError):
            self.User.objects.create(email="", password="foo")

    def test_create_superuser(self):
        admin_user = self.User.objects.create_superuser(email="super@user.com", password="foo") # type: ignore
        self.assertEqual(admin_user.email, "super@user.com")
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        
        try:
            # username is None for the AbstractUser option
            # username does not exist for the AbstractBaseUser option
            self.assertIsNone(admin_user.username)
        except AttributeError:
            pass
        
        with self.assertRaises(ValueError):
            self.User.objects.create_superuser(email="super@user.com", password="foo", is_superuser=False) # type: ignore