from rest_framework.permissions import BasePermission


def get_role(user):
    try:
        return user.profile.role
    except Exception:
        return None


class IsSuperAdminRole(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and get_role(request.user) == 'super_admin'


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and get_role(request.user) in ('admin', 'super_admin')


class IsTeamHeadRole(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and get_role(request.user) == 'team_head'


# ── Composite permissions ──────────────────────────────────────────────────────

class IsAdminOrMentor(BasePermission):
    """
    Admin OR anyone with team duties (mentor, team_member, team_head).
    'mentor' role is deprecated — team_member handles everything.
    """
    def has_permission(self, request, view):
        role = get_role(request.user) if request.user.is_authenticated else None
        return role in ('super_admin', 'admin', 'mentor', 'team_member', 'team_head')


class IsAdminOrTeamHead(BasePermission):
    def has_permission(self, request, view):
        role = get_role(request.user) if request.user.is_authenticated else None
        return role in ('super_admin', 'admin', 'team_head')


class CanManageTasks(BasePermission):
    """
    Who can create / modify tasks:
    - Admin (all tasks)
    - Team Head (tasks within their team)
    - Team Member (their own tasks / intern tasks they manage)
    - Mentor (legacy — same as team_member)
    """
    def has_permission(self, request, view):
        role = get_role(request.user) if request.user.is_authenticated else None
        return role in ('super_admin', 'admin', 'team_head', 'team_member', 'mentor')


class CanManageProject(BasePermission):
    def has_permission(self, request, view):
        role = get_role(request.user) if request.user.is_authenticated else None
        return role in ('super_admin', 'admin', 'team_head')

    def has_object_permission(self, request, view, obj):
        role = get_role(request.user) if request.user.is_authenticated else None
        if role in ('super_admin', 'admin'):
            return True
        
        # Allow the creator to manage their own project
        if hasattr(obj, 'created_by') and obj.created_by_id == request.user.id:
            return True

        if role == 'team_head' and obj.team:
            # Check if this user is the designated head of the project's team
            if obj.team.head_id == request.user.id:
                return True
            # Safety Fallback: Check if they are a member of the team (combined with their team_head role)
            from teams.models import TeamMembership
            if TeamMembership.objects.filter(user=request.user, team=obj.team).exists():
                return True
        return False


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        role = get_role(request.user) if request.user.is_authenticated else None
        if role in ('super_admin', 'admin'):
            return True
        # For meetings, the creator is in created_by
        creator = getattr(obj, 'created_by', None)
        return creator == request.user
