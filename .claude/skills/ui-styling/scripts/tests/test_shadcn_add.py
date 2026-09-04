"""Tests for shadcn_add.py"""

import json
import subprocess
from pathlib import Path
from unittest.mock import MagicMock, mock_open, patch

import pytest

# Add parent directory to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from shadcn_add import ShadcnInstaller


class TestShadcnInstaller:
    """Test ShadcnInstaller class."""

    @pytest.fixture
    def temp_project(self, tmp_path):
        """Create temporary project structure."""
        project_root = tmp_path / "test-project"
        project_root.mkdir()

        # Create components.json
        components_json = project_root / "components.json"
        components_json.write_text(
            json.dumps({
                "style": "new-york",
                "aliases": {
                    "components": "@/components",
                    "utils": "@/lib/utils"
                }
            })
        )

        # Create components directory
        ui_dir = project_root / "components" / "ui"
        ui_dir.mkdir(parents=True)

        return project_root

    def test_init_default_project_root(self):
        """Test initialization with default project root."""
        installer = ShadcnInstaller()
        assert installer.project_root == Path.cwd()
        assert installer.dry_run is False

    def test_init_custom_project_root(self, tmp_path):
        """Test initialization with custom project root."""
        installer = ShadcnInstaller(project_root=tmp_path)
        assert installer.project_root == tmp_path

    def test_init_dry_run(self):
        """Test initialization with dry run mode."""
        installer = ShadcnInstaller(dry_run=True)
        assert installer.dry_run is True

    def test_check_shadcn_config_exists(self, temp_project):
        """Test checking for existing shadcn config."""
        installer = ShadcnInstaller(project_root=temp_project)
        assert installer.check_shadcn_config() is True

    def test_check_shadcn_config_not_exists(self, tmp_path):
        """Test checking for non-existent shadcn config."""
        installer = ShadcnInstaller(project_root=tmp_path)
        assert installer.check_shadcn_config() is False

    def test_get_installed_components_empty(self, temp_project):
        """Test getting installed components when none exist."""
        installer = ShadcnInstaller(project_root=temp_project)
        installed = installer.get_installed_components()
        assert installed == []

    def test_get_installed_components_with_files(self, temp_project):
        """Test getting installed components when files exist."""
        ui_dir = temp_project / "components" / "ui"

        # Create component files
        (ui_dir / "button.tsx").write_text("export const Button = () => {}")
        (ui_dir / "card.tsx").write_text("export const Card = () => {}")

        installer = ShadcnInstaller(project_root=temp_project)
        installed = installer.get_installed_components()

        assert sorted(installed) == ["button", "card"]

    def test_get_installed_components_no_config(self, tmp_path):
        """Test getting installed components without config."""
        installer = ShadcnInstaller(project_root=tmp_path)
        installed = installer.get_installed_components()
        assert installed == []

    def test_add_components_no_components(self, temp_project):
        """Test adding components with empty list."""
        installer = ShadcnInstaller(project_root=temp_project)
        success, message = installer.add_components([])

        assert success is False
        assert "No components specified" in message

    def test_add_components_no_config(self, tmp_path):
        """Test adding components without shadcn config."""
        installer = ShadcnInstaller(project_root=tmp_path)
        success, message = installer.add_components(["button"])

        assert success is False
        assert "not initialized" in message

    def test_add_components_already_installed(self, temp_project):
        """Test adding components that are already installed."""
        ui_dir = temp_project / "components" / "ui"
        (ui_dir / "button.tsx").write_text("export const Button = () => {}")

        installer = ShadcnInstaller(project_root=temp_project)
        success, message = installer.add_components(["button"])

        assert success is False
        assert "already installed" in message
        assert "button" in message

    def test_add_components_with_overwrite(self, temp_project):
        """Test adding components with overwrite flag."""
        ui_dir = temp_project / "components" / "ui"
        (ui_dir / "button.tsx").write_text("export const Button = () => {}")

        installer = ShadcnInstaller(project_root=temp_project)

        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                stdout="Component added successfully",
                returncode=0
            )

            success, message = installer.add_components(["button"], overwrite=True)

            assert success is True
            assert "Successfully added" in message
            mock_run.assert_called_once()

            # Verify --overwrite flag was passed
            call_args = mock_run.call_args[0][0]
            assert "--overwrite" in call_args

    def test_add_components_dry_run(self, temp_project):
        """Test adding components in dry run mode."""
        installer = ShadcnInstaller(project_root=temp_project, dry_run=True)
        success, message = installer.add_components(["button", "card"])

        assert success is True
        assert "Would run:" in message
        assert "button" in message
        assert "card" in message

    @patch("subprocess.run")
    def test_add_components_success(self, mock_run, temp_project):
        """Test successful component addition."""
        mock_run.return_value = MagicMock(
            stdout="Components added successfully",
            stderr="",
            returncode=0
        )

        installer = ShadcnInstaller(project_root=temp_project)
        success, message = installer.add_components(["button", "card"])

        assert success is True
        assert "Successfully added" in message
        assert "button" in message
        assert "card" in message

        # Verify correct command was called. The version segment is resolved by
        # _get_shadcn_version(), so assert against that rather than hardcoding the
        # pinned default -- otherwise bumping the pin silently breaks this test.
        mock_run.assert_called_once()
        call_args = mock_run.call_args[0][0]
        assert call_args[:3] == [
            "npx",
            f"shadcn@{installer._get_shadcn_version()}",
            "add",
        ]
        assert "button" in call_args
        assert "card" in call_args

    def test_get_shadcn_version_falls_back_when_no_package_json(self, temp_project):
        """No package.json at all -> pinned fallback, not 'latest'."""
        installer = ShadcnInstaller(project_root=temp_project)
        version = installer._get_shadcn_version()
        assert version != "latest"
        assert version[0].isdigit()

    def test_get_shadcn_version_falls_back_when_dep_absent(self, temp_project):
        """package.json exists but does not depend on shadcn -> same fallback."""
        fallback = ShadcnInstaller(project_root=temp_project)._get_shadcn_version()
        (temp_project / "package.json").write_text(
            json.dumps({"dependencies": {"react": "^19.0.0"}})
        )
        assert ShadcnInstaller(project_root=temp_project)._get_shadcn_version() == fallback

    def test_get_shadcn_version_reads_dependencies(self, temp_project):
        """A pinned dependency wins over the fallback."""
        (temp_project / "package.json").write_text(json.dumps({"dependencies": {"shadcn": "2.9.1"}}))
        installer = ShadcnInstaller(project_root=temp_project)
        assert installer._get_shadcn_version() == "2.9.1"

    def test_get_shadcn_version_reads_dev_dependencies(self, temp_project):
        """devDependencies is searched too."""
        (temp_project / "package.json").write_text(
            json.dumps({"devDependencies": {"shadcn": "3.0.0"}})
        )
        installer = ShadcnInstaller(project_root=temp_project)
        assert installer._get_shadcn_version() == "3.0.0"

    @pytest.mark.parametrize(
        "declared,expected",
        [("^2.9.1", "2.9.1"), ("~2.9.1", "2.9.1"), (">=2.9.1", "2.9.1"), (">=2.9.1 <3", "2.9.1")],
    )
    def test_get_shadcn_version_strips_range_prefixes(self, temp_project, declared, expected):
        """Semver range syntax is reduced to a concrete version npx can resolve."""
        (temp_project / "package.json").write_text(
            json.dumps({"dependencies": {"shadcn": declared}})
        )
        installer = ShadcnInstaller(project_root=temp_project)
        assert installer._get_shadcn_version() == expected

    def test_get_shadcn_version_survives_malformed_package_json(self, temp_project):
        """A broken package.json must not crash the installer."""
        (temp_project / "package.json").write_text("{ not json")
        installer = ShadcnInstaller(project_root=temp_project)
        version = installer._get_shadcn_version()
        assert version != "latest"
        assert version[0].isdigit()

    @patch("subprocess.run")
    def test_add_components_subprocess_error(self, mock_run, temp_project):
        """Test component addition with subprocess error."""
        mock_run.side_effect = subprocess.CalledProcessError(
            1, "cmd", stderr="Error occurred"
        )

        installer = ShadcnInstaller(project_root=temp_project)
        success, message = installer.add_components(["button"])

        assert success is False
        assert "Failed to add" in message

    @patch("subprocess.run")
    def test_add_components_npx_not_found(self, mock_run, temp_project):
        """Test component addition when npx is not found."""
        mock_run.side_effect = FileNotFoundError()

        installer = ShadcnInstaller(project_root=temp_project)
        success, message = installer.add_components(["button"])

        assert success is False
        assert "npx not found" in message

    def test_add_all_components_no_config(self, tmp_path):
        """Test adding all components without config."""
        installer = ShadcnInstaller(project_root=tmp_path)
        success, message = installer.add_all_components()

        assert success is False
        assert "not initialized" in message

    def test_add_all_components_dry_run(self, temp_project):
        """Test adding all components in dry run mode."""
        installer = ShadcnInstaller(project_root=temp_project, dry_run=True)
        success, message = installer.add_all_components()

        assert success is True
        assert "Would run:" in message
        assert "--all" in message

    @patch("subprocess.run")
    def test_add_all_components_success(self, mock_run, temp_project):
        """Test successful addition of all components."""
        mock_run.return_value = MagicMock(
            stdout="All components added",
            returncode=0
        )

        installer = ShadcnInstaller(project_root=temp_project)
        success, message = installer.add_all_components()

        assert success is True
        assert "Successfully added all" in message

        # Verify --all flag was passed
        call_args = mock_run.call_args[0][0]
        assert "--all" in call_args

    def test_list_installed_no_config(self, tmp_path):
        """Test listing installed components without config."""
        installer = ShadcnInstaller(project_root=tmp_path)
        success, message = installer.list_installed()

        assert success is False
        assert "not initialized" in message

    def test_list_installed_empty(self, temp_project):
        """Test listing installed components when none exist."""
        installer = ShadcnInstaller(project_root=temp_project)
        success, message = installer.list_installed()

        assert success is True
        assert "No components installed" in message

    def test_list_installed_with_components(self, temp_project):
        """Test listing installed components when they exist."""
        ui_dir = temp_project / "components" / "ui"
        (ui_dir / "button.tsx").write_text("export const Button = () => {}")
        (ui_dir / "card.tsx").write_text("export const Card = () => {}")

        installer = ShadcnInstaller(project_root=temp_project)
        success, message = installer.list_installed()

        assert success is True
        assert "button" in message
        assert "card" in message
