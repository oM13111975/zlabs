from activity_logs.models import ActivityLog


def log_activity(user, action_type, description, content_object=None, team=None):
    from django.contrib.contenttypes.models import ContentType

    log = ActivityLog(
        user=user,
        action_type=action_type,
        description=description,
        team=team,
    )

    if content_object:
        ct = ContentType.objects.get_for_model(content_object)
        log.content_type = ct
        log.object_id = content_object.pk

    log.save()
    return log
